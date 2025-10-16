import { useCallback, useEffect, useRef, useState } from 'react';

import { ITeamInitStatusEnum } from '@/apis/authz/team/typings.ts';

interface TeamStatusSSEEvent {
  type: 'connected' | 'status_update' | 'heartbeat' | 'complete';
  teamId: string;
  status?: ITeamInitStatusEnum;
  timestamp: string;
}

interface UseTeamStatusSSEOptions {
  enabled?: boolean;
  onStatusChange?: (status: ITeamInitStatusEnum | undefined) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseTeamStatusSSEReturn {
  status: ITeamInitStatusEnum | undefined;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

export const useTeamStatusSSE = (teamId: string, options: UseTeamStatusSSEOptions = {}): UseTeamStatusSSEReturn => {
  const { enabled = true, onStatusChange, onError, onConnect, onDisconnect } = options;

  const [status, setStatus] = useState<ITeamInitStatusEnum | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // 获取团队状态（可能是普通响应或 SSE 流）
  const fetchTeamStatus = useCallback(async () => {
    if (!teamId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      // 构建请求 URL
      const statusUrl = `/api/teams/${teamId}/status`;

      // 先尝试普通请求
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      // 检查响应类型
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // 普通 JSON 响应（状态为 null 或 SUCCESS）
        const data = await response.json();
        if (data?.success) {
          setStatus(data.data);
          onStatusChange?.(data.data);
        }
        setIsLoading(false);
      } else if (contentType?.includes('text/event-stream')) {
        // SSE 流响应（状态为 PENDING 或 FAILED）
        handleSSEStream(statusUrl);
      } else {
        throw new Error('未知的响应类型');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取团队状态失败');
      setError(error);
      onError?.(error);
      setIsLoading(false);
    }
  }, [teamId, enabled, onStatusChange, onError]);

  // 处理 SSE 流
  const handleSSEStream = useCallback(
    (sseUrl: string) => {
      if (eventSourceRef.current) return;

      try {
        // 创建 EventSource
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        // 连接成功
        eventSource.onopen = () => {
          setIsConnected(true);
          setIsLoading(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          onConnect?.();
        };

        // 处理消息
        eventSource.onmessage = (event) => {
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
                // 流完成，断开连接
                if (data.status !== undefined) {
                  setStatus(data.status);
                  onStatusChange?.(data.status);
                }
                disconnect();
                break;

              case 'heartbeat':
                // 心跳消息，保持连接活跃
                break;
            }
          } catch (err) {
            console.warn('解析 SSE 消息失败:', err);
          }
        };

        // 处理错误
        eventSource.onerror = (event) => {
          console.error('SSE 连接错误:', event);
          setIsConnected(false);
          setIsLoading(false);

          const error = new Error('SSE 连接失败');
          setError(error);
          onError?.(error);

          // 尝试重连
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              handleSSEStream(sseUrl);
            }, reconnectDelay);
          } else {
            onDisconnect?.();
          }
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('创建 SSE 连接失败');
        setError(error);
        onError?.(error);
        setIsLoading(false);
      }
    },
    [onStatusChange, onError, onConnect, onDisconnect],
  );

  // 断开连接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
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
  }, [onDisconnect]);

  // 重连
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    fetchTeamStatus();
  }, [disconnect, fetchTeamStatus]);

  // 初始化
  useEffect(() => {
    if (enabled && teamId) {
      fetchTeamStatus();
    }

    return () => {
      disconnect();
    };
  }, [enabled, teamId, fetchTeamStatus, disconnect]);

  // 清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    isConnected,
    isLoading,
    error,
    reconnect,
    disconnect,
  };
};
