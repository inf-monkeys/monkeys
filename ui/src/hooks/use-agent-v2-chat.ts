import { useCallback, useEffect, useRef, useState } from 'react';

import {
  IAgentV2ChatMessage,
  sendMessageToSession,
  submitFollowupAnswer,
  useAgentV2Messages,
  useAgentV2SessionStatus,
} from '@/apis/agents-v2/chat';
import { getVinesToken } from '@/apis/utils';
import { getVinesTeamId } from '@/components/router/guard/team';
import { nanoIdLowerCase } from '@/utils';
import { getSSELogger, resetSSELogger } from '@/utils/sse-logger';

interface IFollowupQuestion {
  question: string;
  suggestions?: Array<{ answer: string; mode?: string }>;
}

interface IAgentV2ChatState {
  messages: IAgentV2ChatMessage[];
  sessionId?: string;
  isConnected: boolean;
  isLoading: boolean;
  connectionError?: Error;
  followupQuestion?: IFollowupQuestion;
}

interface IAgentV2ChatActions {
  sendMessage: (message: string) => Promise<void>;
  answerFollowup: (answer: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export const useAgentV2Chat = (
  agentId: string,
  externalSessionId?: string,
): IAgentV2ChatState & IAgentV2ChatActions => {
  const [sessionId, setSessionId] = useState<string>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<Error>();
  const [followupQuestion, setFollowupQuestion] = useState<IFollowupQuestion>();
  const [messages, setMessages] = useState<IAgentV2ChatMessage[]>([]);

  // EventSource reference
  const eventSourceRef = useRef<EventSource>();
  const messageQueueRef = useRef<string[]>([]);
  const currentSessionIdRef = useRef<string>();

  // 确定要使用的sessionId：优先使用外部传入的，否则使用内部创建的
  const effectiveSessionId = externalSessionId || sessionId;

  // 获取会话状态
  const { data: sessionStatus } = useAgentV2SessionStatus(effectiveSessionId);

  // 获取历史消息 - 只在有实际sessionId时才获取
  const { data: messagesResponse } = useAgentV2Messages(
    effectiveSessionId && effectiveSessionId !== '' ? effectiveSessionId : undefined,
  );

  // 当外部sessionId变化时，清空消息并重置状态
  useEffect(() => {
    if (externalSessionId !== undefined && externalSessionId !== sessionId) {
      // 关闭现有连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setIsConnected(false);
      }

      // 清空消息和状态
      setMessages([]);
      setFollowupQuestion(undefined);
      setConnectionError(undefined);
      setIsLoading(false);

      // 更新sessionId为外部提供的ID
      setSessionId(externalSessionId);
    }
  }, [externalSessionId, sessionId]);

  // 更新消息列表
  useEffect(() => {
    // 新建对话时（externalSessionId为空字符串）不加载历史消息
    if (externalSessionId === '') {
      return;
    }

    // 检查两种可能的响应格式
    const messages = (messagesResponse as any)?.messages || messagesResponse?.data?.messages;

    if (messages && messages.length > 0) {
      const historicalMessages: IAgentV2ChatMessage[] = messages.map((msg) => {
        // 根据API返回数据，isSystem为true表示助手消息，false表示用户消息
        const role = msg.isSystem ? 'assistant' : 'user';

        return {
          id: msg.id,
          role,
          content: msg.content || '',
          toolCalls: msg.toolCalls,
          createdAt: new Date(msg.createdTimestamp),
          senderId: msg.senderId,
          isSystem: msg.isSystem,
        };
      });

      setMessages((prev) => {
        // 改进的去重逻辑：同时基于ID和内容进行去重
        const existingIds = new Set(prev.map((m) => m.id));
        const existingContents = new Map(prev.map((m) => [`${m.role}:${m.content.trim()}`, m]));

        const newMessages = historicalMessages.filter((m) => {
          // 首先检查ID去重
          if (existingIds.has(m.id)) {
            return false;
          }

          // 然后检查内容去重：相同角色+相同内容的消息
          const contentKey = `${m.role}:${m.content.trim()}`;
          const existingMsg = existingContents.get(contentKey);

          if (existingMsg) {
            // 如果存在相同内容的消息，检查时间差
            const timeDiff = Math.abs(m.createdAt.getTime() - existingMsg.createdAt.getTime());

            // 如果时间差小于10秒，认为是重复消息
            if (timeDiff < 10000) {
              return false;
            }
          }

          return true;
        });

        if (newMessages.length > 0) {
          return [...prev, ...newMessages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        return prev;
      });
    }
  }, [messagesResponse, externalSessionId]);

  // 建立 SSE 连接
  const establishConnection = useCallback(async (agentId: string, initialMessage: string) => {
    // 重置并开始SSE日志记录
    const sseLogger = resetSSELogger(`agent-${agentId}-${Date.now()}`);
    sseLogger.startRecording();
    sseLogger.logMessage('Connection establishment started', {
      agentId,
      initialMessage: initialMessage.substring(0, 100),
    });

    try {
      setConnectionError(undefined);
      setIsLoading(true);

      // 关闭现有连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const teamId = getVinesTeamId();
      const token = getVinesToken();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // 使用 fetch 来发起 POST 请求，然后处理 SSE 响应
      const response = await fetch(`/api/agent-v2/${agentId}/sessions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(teamId && { 'x-monkeys-teamid': teamId }),
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ initialMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 创建 EventSource 来处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body available');
      }

      setIsConnected(true);

      // 处理流式数据
      const processStream = async () => {
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('event:')) {
                // Skip event type lines
                continue;
              }

              if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim();

                try {
                  const data = JSON.parse(dataStr);
                  handleSSEEvent(data);
                } catch (parseError) {
                  // 忽略JSON解析错误的SSE数据行
                }
              }
            }
          }
        } catch (streamError) {
          setConnectionError(streamError instanceof Error ? streamError : new Error('Stream error'));
          setIsConnected(false);
        }
      };

      processStream();
    } catch (error) {
      setConnectionError(error instanceof Error ? error : new Error('Connection failed'));
      setIsConnected(false);
      setIsLoading(false);
    }
  }, []);

  // 处理 SSE 事件
  const handleSSEEvent = useCallback((data: any) => {
    // 记录SSE事件到日志文件
    const sseLogger = getSSELogger();
    sseLogger.logSSEEvent(data.type, data);

    switch (data.type) {
      case 'session_start':
        break;

      case 'session_metadata':
        setSessionId(data.sessionId);
        currentSessionIdRef.current = data.sessionId;

        // 处理排队的消息
        if (messageQueueRef.current.length > 0) {
          const queuedMessages = [...messageQueueRef.current];
          messageQueueRef.current = [];

          queuedMessages.forEach(async (message) => {
            await sendMessageToSession(data.sessionId, message);
          });
        }
        break;

      case 'message_chunk':
        // 实时更新助手消息
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
            // 更新现有的流式消息
            return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.content }];
          } else {
            // 创建新的助手消息
            return [
              ...prev,
              {
                id: nanoIdLowerCase(),
                role: 'assistant',
                content: data.content,
                createdAt: new Date(),
                isStreaming: true,
              },
            ];
          }
        });
        break;

      case 'tool_use':
        // 处理todo更新工具调用
        if (data.name === 'update_todo_list' && data.params?.todos) {
          // 将todo更新信息注入到当前的流式消息中
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];

            if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
              // 在现有消息内容中添加todo更新标签
              const todoUpdateXml = `<update_todo_list><todos>${data.params.todos}</todos></update_todo_list>`;

              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + todoUpdateXml,
                  // 添加工具调用信息到消息的元数据中
                  toolCalls: [
                    ...(lastMessage.toolCalls || []),
                    {
                      id: data.id,
                      name: data.name,
                      params: data.params,
                    },
                  ],
                },
              ];
            } else {
              // 如果没有流式消息，创建一个新的包含todo更新的消息
              const todoUpdateXml = `<update_todo_list><todos>${data.params.todos}</todos></update_todo_list>`;

              return [
                ...prev,
                {
                  id: nanoIdLowerCase(),
                  role: 'assistant',
                  content: todoUpdateXml,
                  createdAt: new Date(),
                  isStreaming: true,
                  toolCalls: [
                    {
                      id: data.id,
                      name: data.name,
                      params: data.params,
                    },
                  ],
                },
              ];
            }
          });
        }
        break;

      case 'tool_calls':
        // TODO: 在未来可以添加工具调用的 UI 显示
        break;

      case 'tool_result':
        break;

      case 'followup_question':
        setFollowupQuestion({
          question: data.question,
          suggestions: data.suggestions,
        });
        break;

      case 'response_complete':
        setIsLoading(false);

        // 标记流式消息完成
        setMessages((prev) => prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg)));
        break;

      case 'complete':
        setIsLoading(false);
        setIsConnected(false);
        break;

      case 'error':
        setConnectionError(new Error(data.error || 'Unknown SSE error'));
        setIsLoading(false);
        setIsConnected(false);
        break;

      case 'heartbeat':
        // 心跳，不需要处理
        break;

      default:
        break;
    }
  }, []);

  // 为现有session发送消息（临时方案：直接使用message API）
  const establishConnectionForExistingSession = useCallback(async (sessionId: string, message: string) => {
    try {
      setConnectionError(undefined);
      setIsLoading(true);

      // 直接发送消息到session，不建立SSE连接
      const success = await sendMessageToSession(sessionId, message);

      if (!success) {
        throw new Error('Failed to send message to existing session');
      }

      setIsLoading(false);
    } catch (error) {
      setConnectionError(error as Error);
      setIsLoading(false);
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: IAgentV2ChatMessage = {
        id: nanoIdLowerCase(),
        role: 'user',
        content,
        createdAt: new Date(),
      };

      // 立即添加用户消息到界面（去重保护）
      setMessages((prev) => {
        // 检查是否已经存在相同ID的消息，避免重复添加
        const existingMessage = prev.find((m) => m.id === userMessage.id);
        if (existingMessage) {
          return prev;
        }

        const newMessages = [...prev, userMessage];
        return newMessages;
      });
      setIsLoading(true);

      // 清除任何现有的 followup 问题
      setFollowupQuestion(undefined);

      if (!isConnected) {
        // 没有SSE连接时：建立连接（新会话或历史会话都用这个逻辑）
        if (externalSessionId) {
          await establishConnectionForExistingSession(externalSessionId, content);
        } else {
          await establishConnection(agentId, content);
        }
      } else {
        // 已有SSE连接：发送到当前活跃会话
        const targetSessionId = externalSessionId || currentSessionIdRef.current;
        if (!targetSessionId) {
          setIsLoading(false);
          return;
        }

        const success = await sendMessageToSession(targetSessionId, content);

        if (!success) {
          setIsLoading(false);
        }
      }
    },
    [agentId, externalSessionId, isConnected, establishConnection, establishConnectionForExistingSession],
  );

  // 回答 followup 问题
  const answerFollowup = useCallback(
    async (answer: string) => {
      if (!followupQuestion || !currentSessionIdRef.current) {
        return;
      }

      const success = await submitFollowupAnswer(currentSessionIdRef.current, answer);

      if (success) {
        setFollowupQuestion(undefined);
      }
    },
    [followupQuestion],
  );

  // 断开连接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = undefined;
    }

    setIsConnected(false);
    setIsLoading(false);
    setConnectionError(undefined);
  }, []);

  // 重连
  const reconnect = useCallback(async () => {
    disconnect();

    // 如果有消息队列，使用第一条消息重连
    if (messageQueueRef.current.length > 0) {
      await establishConnection(agentId, messageQueueRef.current[0]);
    }
  }, [agentId, disconnect, establishConnection]);

  // 清理
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 同步会话状态
  useEffect(() => {
    if (sessionStatus && sessionId) {
      // 如果会话不活跃且我们认为已连接，更新连接状态
      if (!sessionStatus.isActive && isConnected) {
        setIsConnected(false);
        setIsLoading(false);
      }
    }
  }, [sessionStatus, sessionId, isConnected]);

  return {
    messages,
    sessionId: effectiveSessionId, // 返回有效的sessionId（外部或内部）
    isConnected,
    isLoading,
    connectionError,
    followupQuestion,
    sendMessage,
    answerFollowup,
    disconnect,
    reconnect,
  };
};
