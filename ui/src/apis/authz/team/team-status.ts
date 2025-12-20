import { useCallback, useEffect, useRef, useState } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

import { ITeamInitStatusEnum } from '@/apis/authz/team/typings.ts';
import { vinesHeader } from '@/apis/utils';
import { useTeamStatusStore } from '@/store/useTeamStatusStore';

/**
 * SSE 事件结构
 */
interface TeamStatusSSEEvent {
  type: 'connected' | 'status_update' | 'heartbeat' | 'complete' | 'error';
  teamId: string;
  status?: ITeamInitStatusEnum;
  timestamp: string;
  error?: string;
}

/**
 * Hook 外部可传入的选项
 */
interface UseTeamStatusSSEOptions {
  enabled?: boolean;
  onStatusChange?: (status: ITeamInitStatusEnum | undefined) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Hook 返回值
 */
interface UseTeamStatusSSEReturn {
  status: ITeamInitStatusEnum | undefined;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

const SSE_INTERNAL_CONFIG = {
  reconnectDelay: 3000, // 初始重连延时
  maxReconnectAttempts: 5, // 最大重连次数
};

/**
 * SSE 连接管理器 - 单例模式
 * 确保同一个 teamId 在当前标签页只有一个 SSE 连接
 */
interface SSEConnectionInfo {
  eventSource: EventSourcePolyfill;
  subscribers: Set<(event: TeamStatusSSEEvent) => void>;
  status: ITeamInitStatusEnum | undefined;
  isConnected: boolean;
}

class SSEConnectionManager {
  private connections = new Map<string, SSEConnectionInfo>();

  /**
   * 订阅团队状态更新
   */
  subscribe(
    teamId: string,
    token: string,
    callback: (event: TeamStatusSSEEvent) => void,
  ): () => void {
    let connectionInfo = this.connections.get(teamId);

    if (!connectionInfo) {
      // 创建新连接
      console.log('[SSEManager] 创建新的 SSE 连接', { teamId });
      connectionInfo = this.createConnection(teamId, token);
      this.connections.set(teamId, connectionInfo);
    } else {
      console.log('[SSEManager] 复用现有 SSE 连接', {
        teamId,
        subscriberCount: connectionInfo.subscribers.size,
        isConnected: connectionInfo.isConnected,
        readyState: connectionInfo.eventSource.readyState,
      });

      // 检查连接状态,如果连接已关闭或失败,创建新连接
      const readyState = connectionInfo.eventSource.readyState;
      if (readyState === EventSource.CLOSED) {
        console.log('[SSEManager] 检测到连接已关闭,创建新连接', { teamId });
        // 清理旧连接
        connectionInfo.eventSource.close();
        this.connections.delete(teamId);
        // 创建新连接
        connectionInfo = this.createConnection(teamId, token);
        this.connections.set(teamId, connectionInfo);
      } else if (connectionInfo.isConnected) {
        // 如果已连接,立即触发 connected 事件
        callback({
          type: 'connected',
          teamId,
          timestamp: new Date().toISOString(),
          status: connectionInfo.status,
        });
      }
    }

    // 添加订阅者
    connectionInfo.subscribers.add(callback);

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(teamId, callback);
    };
  }

  /**
   * 取消订阅
   */
  private unsubscribe(teamId: string, callback: (event: TeamStatusSSEEvent) => void) {
    const connectionInfo = this.connections.get(teamId);
    if (!connectionInfo) return;

    connectionInfo.subscribers.delete(callback);

    // 如果没有订阅者了,关闭连接
    if (connectionInfo.subscribers.size === 0) {
      console.log('[SSEManager] 没有订阅者,关闭 SSE 连接', { teamId });
      connectionInfo.eventSource.close();
      this.connections.delete(teamId);
    }
  }

  /**
   * 创建 SSE 连接
   */
  private createConnection(teamId: string, token: string): SSEConnectionInfo {
    const url = `/api/teams/${teamId}/init-status`;

    const eventSource = new EventSourcePolyfill(url, {
      headers: {
        Authorization: token,
      },
      withCredentials: false,
    });

    const connectionInfo: SSEConnectionInfo = {
      eventSource,
      subscribers: new Set(),
      status: undefined,
      isConnected: false,
    };

    eventSource.onopen = () => {
      console.log('[SSEManager] SSE 连接已打开', { teamId });
      connectionInfo.isConnected = true;
      this.broadcast(teamId, {
        type: 'connected',
        teamId,
        timestamp: new Date().toISOString(),
      });
    };

    eventSource.onerror = (error) => {
      console.error('[SSEManager] SSE 连接错误', { teamId, error });
      connectionInfo.isConnected = false;
      this.broadcast(teamId, {
        type: 'error',
        teamId,
        timestamp: new Date().toISOString(),
        error: 'SSE connection error',
      });

      // 清理连接
      eventSource.close();
      this.connections.delete(teamId);
    };

    // 监听不同类型的事件
    const eventTypes = ['connected', 'status_update', 'heartbeat', 'complete'] as const;

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event: any) => {
        try {
          const data = JSON.parse(event.data) as TeamStatusSSEEvent;
          console.log('[SSEManager] 收到事件', { eventType, teamId, data });

          // 更新状态
          if (data.status !== undefined) {
            connectionInfo.status = data.status;
          }

          this.broadcast(teamId, data);

          // 如果是 complete 事件,关闭连接
          if (data.type === 'complete') {
            console.log('[SSEManager] 收到 complete,关闭连接', { teamId });
            eventSource.close();
            this.connections.delete(teamId);
          }
        } catch (err) {
          console.error('[SSEManager] 解析事件失败', err);
        }
      });
    });

    return connectionInfo;
  }

  /**
   * 广播消息给所有订阅者
   */
  private broadcast(teamId: string, event: TeamStatusSSEEvent) {
    const connectionInfo = this.connections.get(teamId);
    if (!connectionInfo) return;

    connectionInfo.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('[SSEManager] 订阅者回调执行失败', err);
      }
    });
  }

  /**
   * 获取连接信息(用于调试)
   */
  getConnectionInfo(teamId: string) {
    const info = this.connections.get(teamId);
    return {
      exists: !!info,
      subscriberCount: info?.subscribers.size ?? 0,
      isConnected: info?.isConnected ?? false,
      status: info?.status,
    };
  }

  /**
   * 打印当前标签页的所有 SSE 连接信息
   */
  printAllConnections() {
    console.log('[SSEManager] ===== 当前标签页 SSE 连接统计 =====');
    console.log('[SSEManager] 总连接数:', this.connections.size);

    if (this.connections.size === 0) {
      console.log('[SSEManager] 当前没有活跃的 SSE 连接');
      return;
    }

    const getReadyStateName = (state: number) => {
      switch (state) {
        case EventSource.CONNECTING:
          return 'CONNECTING';
        case EventSource.OPEN:
          return 'OPEN';
        case EventSource.CLOSED:
          return 'CLOSED';
        default:
          return 'UNKNOWN';
      }
    };

    this.connections.forEach((info, teamId) => {
      const readyState = info.eventSource.readyState;
      console.log(`[SSEManager] TeamID: ${teamId}`, {
        isConnected: info.isConnected,
        readyState: `${readyState} (${getReadyStateName(readyState)})`,
        subscriberCount: info.subscribers.size,
        status: info.status,
      });
    });

    console.log('[SSEManager] ========================================');
  }
}

// 全局单例
const sseManager = new SSEConnectionManager();

// 暴露到 window 对象,方便在控制台调试
if (typeof window !== 'undefined') {
  (window as any).__sseManager = sseManager;
  console.log('[SSEManager] 已挂载到 window.__sseManager,可在控制台调用 window.__sseManager.printAllConnections()');
}

/**
 * Hook: useTeamStatusSSE
 * 使用单例 SSE 连接管理器,确保同一标签页内同一 teamId 只有一个连接
 * 多个组件可以复用同一个连接
 */
export const useTeamStatusSSE = (teamId: string, options: UseTeamStatusSSEOptions = {}): UseTeamStatusSSEReturn => {
  const { enabled = true, onStatusChange, onError, onConnect, onDisconnect } = options;

  const [status, setStatus] = useState<ITeamInitStatusEnum | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualCloseRef = useRef(false);

  // 订阅来自 store 的刷新信号（仅订阅该 teamId 对应的刷新时间戳）
  const refreshTrigger = useTeamStatusStore((state) => state.refreshTriggers[teamId]);

  // ---- 内部通用断开逻辑 ----
  const disconnect = useCallback(() => {
    manualCloseRef.current = true;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsLoading(false);
    reconnectAttemptsRef.current = 0;

    onDisconnect?.();
  }, [onDisconnect]);

  // ---- 建立 SSE 连接 ----
  const connectSSE = useCallback(() => {
    if (!teamId || !enabled) return;

    console.log('[useTeamStatusSSE] 开始连接 SSE', { teamId });

    manualCloseRef.current = false;

    // 获取 token
    const headers = vinesHeader({});
    const token = headers.Authorization || '';

    // 订阅 SSE 事件
    unsubscribeRef.current = sseManager.subscribe(teamId, token, (event) => {
      switch (event.type) {
        case 'connected':
          setIsConnected(true);
          setIsLoading(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          if (event.status !== undefined) {
            setStatus(event.status);
            onStatusChange?.(event.status);
          }
          onConnect?.();
          break;

        case 'status_update':
          if (event.status !== undefined) {
            setStatus(event.status);
            onStatusChange?.(event.status);
          }
          break;

        case 'complete':
          if (event.status !== undefined) {
            setStatus(event.status);
            onStatusChange?.(event.status);
          }
          setIsConnected(false);
          setIsLoading(false);
          break;

        case 'heartbeat':
          // 心跳包，不做处理
          break;

        case 'error':
          if (!manualCloseRef.current) {
            setIsConnected(false);
            setIsLoading(false);
            const err = new Error(event.error || 'SSE 连接错误');
            setError(err);
            onError?.(err);

            // 自动重连
            const { reconnectDelay, maxReconnectAttempts } = SSE_INTERNAL_CONFIG;
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
              reconnectAttemptsRef.current++;
              reconnectTimeoutRef.current = setTimeout(() => {
                connectSSE();
              }, delay);
            } else {
              onDisconnect?.();
            }
          }
          break;
      }
    });

    setIsLoading(true);
  }, [teamId, enabled, onConnect, onDisconnect, onError, onStatusChange]);

  // ---- 普通请求（探测响应类型） ----
  const fetchTeamStatus = useCallback(async () => {
    if (!teamId || !enabled) return;

    setIsLoading(true);
    setError(null);

    const statusUrl = `/api/teams/${teamId}/init-status`;

    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/event-stream',
          ...vinesHeader({}),
        },
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data?.success) {
          setStatus(data.data);
          onStatusChange?.(data.data);
        }
        setIsLoading(false);
      } else if (contentType.includes('text/event-stream')) {
        // 使用 SSE 连接管理器
        connectSSE();
      } else {
        throw new Error('未知响应类型');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取团队状态失败');
      setError(error);
      setIsLoading(false);
      onError?.(error);
    }
  }, [teamId, enabled, connectSSE, onStatusChange, onError]);

  // ---- 手动重连 ----
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    fetchTeamStatus();
  }, [disconnect, fetchTeamStatus]);

  // ---- 初始化与清理 ----
  useEffect(() => {
    if (enabled && teamId) fetchTeamStatus();
    return disconnect;
  }, [enabled, teamId, fetchTeamStatus, disconnect]);

  // ---- 响应刷新信号 ----
  useEffect(() => {
    if (enabled && teamId && refreshTrigger !== undefined) {
      reconnect();
    }
  }, [refreshTrigger, enabled, teamId, reconnect]);

  return {
    status,
    isConnected,
    isLoading,
    error,
    reconnect,
    disconnect,
  };
};
