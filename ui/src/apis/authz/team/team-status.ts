import { useCallback, useEffect, useRef, useState } from 'react';

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
 * Hook: useTeamStatusSSE
 * 使用 SharedWorker 共享 SSE 连接，避免 HTTP/1.1 连接限制
 */
export const useTeamStatusSSE = (teamId: string, options: UseTeamStatusSSEOptions = {}): UseTeamStatusSSEReturn => {
  const { enabled = true, onStatusChange, onError, onConnect, onDisconnect } = options;

  const [status, setStatus] = useState<ITeamInitStatusEnum | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const workerRef = useRef<SharedWorker | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const manualCloseRef = useRef(false);

  // 订阅来自 store 的刷新信号（仅订阅该 teamId 对应的刷新时间戳）
  const refreshTrigger = useTeamStatusStore((state) => state.refreshTriggers[teamId]);

  // ---- 内部通用断开逻辑 ----
  const disconnect = useCallback(() => {
    manualCloseRef.current = true;

    if (workerRef.current) {
      workerRef.current.port.postMessage({
        action: 'unsubscribe',
        teamId,
      });
      workerRef.current.port.close();
      workerRef.current = null;
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

  // ---- 建立 SharedWorker 连接 ----
  const connectWorker = useCallback(() => {
    if (!teamId || !enabled) return;

    manualCloseRef.current = false;

    try {
      // 创建 SharedWorker
      const worker = new SharedWorker(new URL('@/workers/team-status-worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current = worker;

      // 监听来自 Worker 的消息
      worker.port.onmessage = (event: MessageEvent<TeamStatusSSEEvent>) => {
        const data = event.data;

        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            setIsLoading(false);
            setError(null);
            reconnectAttemptsRef.current = 0;
            onConnect?.();
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
            // SSE 流结束，但不断开 Worker 连接
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
              const err = new Error(data.error || 'SSE 连接错误');
              setError(err);
              onError?.(err);

              // 自动重连
              const { reconnectDelay, maxReconnectAttempts } = SSE_INTERNAL_CONFIG;
              if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
                reconnectAttemptsRef.current++;
                reconnectTimeoutRef.current = setTimeout(() => {
                  reconnect();
                }, delay);
              } else {
                onDisconnect?.();
              }
            }
            break;
        }
      };

      // 启动端口
      worker.port.start();

      // 获取 token
      const headers = vinesHeader({});
      const token = headers.Authorization || '';

      // 订阅团队状态
      worker.port.postMessage({
        action: 'subscribe',
        teamId,
        token,
      });

      setIsLoading(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('创建 SharedWorker 失败');
      setError(error);
      setIsLoading(false);
      onError?.(error);
    }
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
        // 使用 SharedWorker 连接 SSE
        connectWorker();
      } else {
        throw new Error('未知响应类型');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取团队状态失败');
      setError(error);
      setIsLoading(false);
      onError?.(error);
    }
  }, [teamId, enabled, connectWorker, onStatusChange, onError]);

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
