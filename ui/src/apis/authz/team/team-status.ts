import { useCallback, useEffect, useRef, useState } from 'react';

import { EventSourcePolyfill } from 'event-source-polyfill';

import { ITeamInitStatusEnum } from '@/apis/authz/team/typings.ts';
import { vinesHeader } from '@/apis/utils';
import { useTeamStatusStore } from '@/store/useTeamStatusStore';

/**
 * SSE 事件结构
 */
interface TeamStatusSSEEvent {
  type: 'connected' | 'status_update' | 'heartbeat' | 'complete';
  teamId: string;
  status?: ITeamInitStatusEnum;
  timestamp: string;
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

// 标签页内连接跟踪（同一标签页内的多个组件实例共享连接）
// 注意：不同浏览器标签页有各自的 JavaScript 运行时，此 Map 不会跨标签页共享
const activeConnections = new Map<string, EventSourcePolyfill>();

/**
 * Hook: useTeamStatusSSE
 * 自动区分普通响应和 SSE 流，内置鉴权与重连逻辑。
 */
export const useTeamStatusSSE = (teamId: string, options: UseTeamStatusSSEOptions = {}): UseTeamStatusSSEReturn => {
  const { enabled = true, onStatusChange, onError, onConnect, onDisconnect } = options;

  const [status, setStatus] = useState<ITeamInitStatusEnum | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualCloseRef = useRef(false);

  // 订阅来自 store 的刷新信号（仅订阅该 teamId 对应的刷新时间戳）
  const refreshTrigger = useTeamStatusStore((state) => state.refreshTriggers[teamId]);

  // ---- 内部通用断开逻辑 ----
  const disconnect = useCallback(() => {
    manualCloseRef.current = true;

    if (eventSourceRef.current) {
      // 从标签页内连接池中移除
      const statusUrl = `/api/teams/${teamId}/init-status`;
      activeConnections.delete(statusUrl);

      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsLoading(false);
    reconnectAttemptsRef.current = 0;

    onDisconnect?.();
  }, [onDisconnect, teamId]);

  // ---- 建立 SSE 连接 ----
  const connectSSE = useCallback(
    (sseUrl: string) => {
      // 检查当前标签页内是否已有该 URL 的活跃连接
      const existingConnection = activeConnections.get(sseUrl);
      if (existingConnection && existingConnection.readyState !== EventSource.CLOSED) {
        // 复用现有连接
        console.log(`复用标签页内现有的 SSE 连接: ${sseUrl}`);
        eventSourceRef.current = existingConnection;
        setIsConnected(true);
        return;
      }

      // 检查当前实例是否已有连接
      if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
        console.warn('当前实例已有 SSE 连接，跳过重复连接');
        return;
      }

      manualCloseRef.current = false;

      try {
        const headers = vinesHeader({});

        const es = new EventSourcePolyfill(sseUrl, {
          headers,
          withCredentials: false,
        });

        // 将连接添加到标签页内连接池
        activeConnections.set(sseUrl, es);
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
          setIsLoading(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          onConnect?.();
        };

        const handleEvent = (_: string) => (event: MessageEvent) => {
          try {
            const data: TeamStatusSSEEvent = JSON.parse(event.data);

            switch (data.type) {
              case 'connected':
                setIsConnected(true);
                break;

              case 'status_update':
                if (data.status !== undefined) {
                  setStatus(data.status);
                  onStatusChange?.(data.status);
                }
                break;

              case 'complete':
                if (data.status !== undefined) {
                  setStatus(data.status);
                  onStatusChange?.(data.status);
                }
                disconnect();
                break;

              case 'heartbeat':
                // 心跳包，不做处理
                break;
            }
          } catch (err) {
            console.warn('解析 SSE 消息失败:', err);
          }
        };

        const eventTypes = ['connected', 'status_update', 'heartbeat', 'complete'];
        eventTypes.forEach((type) => es.addEventListener(type as any, handleEvent(type)));

        es.onerror = () => {
          if (manualCloseRef.current) return;

          // 从标签页内连接池中移除失败的连接
          activeConnections.delete(sseUrl);

          setIsConnected(false);
          setIsLoading(false);
          const err = new Error('SSE 连接中断');
          setError(err);
          onError?.(err);

          // 自动重连
          const { reconnectDelay, maxReconnectAttempts } = SSE_INTERNAL_CONFIG;
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE(sseUrl);
            }, delay);
          } else {
            onDisconnect?.();
          }
        };
      } catch (err) {
        // 从连接池中移除失败的连接
        activeConnections.delete(sseUrl);

        const error = err instanceof Error ? err : new Error('创建 SSE 连接失败');
        setError(error);
        setIsLoading(false);
        onError?.(error);
      }
    },
    [onConnect, onDisconnect, onError, onStatusChange, disconnect],
  );

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
        connectSSE(statusUrl);
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
