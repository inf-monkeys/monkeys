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

  // EventSource reference (legacy, kept for compatibility)
  const eventSourceRef = useRef<EventSource>();
  // Abort controller for current fetch stream
  const streamAbortRef = useRef<AbortController>();
  const messageQueueRef = useRef<string[]>([]);
  const currentSessionIdRef = useRef<string>();
  const creatingSessionRef = useRef<boolean>(false);

  // 确定要使用的sessionId：优先使用外部传入的，否则使用内部创建的
  const effectiveSessionId = externalSessionId || sessionId;

  // 获取会话状态
  const { data: sessionStatus } = useAgentV2SessionStatus(effectiveSessionId);

  // 获取历史消息 - 只在有实际sessionId且不是新创建的session时才获取
  const { data: messagesResponse } = useAgentV2Messages(
    effectiveSessionId && effectiveSessionId !== '' && externalSessionId ? effectiveSessionId : undefined,
  );

  // 当外部sessionId变化时，清空消息并重置状态
  const prevExternalSessionIdRef = useRef<string | undefined>();
  const lastStorageValueRef = useRef<any>();

  useEffect(() => {
    const prevSessionId = prevExternalSessionIdRef.current;
    prevExternalSessionIdRef.current = externalSessionId;

    // 新建对话：每次点击“新建对话”都会把 externalSessionId 设为 ''。
    // 即使与上一次相同（都是 ''），也需要重置内部会话状态，
    // 以便下一条消息创建全新的会话。
    if (externalSessionId === '') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = undefined;
      }
      setIsConnected(false);
      setIsLoading(false);
      setConnectionError(undefined);

      setMessages([]);
      setFollowupQuestion(undefined);
      setSessionId(undefined);
      currentSessionIdRef.current = undefined;
      creatingSessionRef.current = false;
      return;
    }

    // 其余情况：仅在外部 session 确实发生变化时处理
    if (externalSessionId === prevSessionId) {
      return;
    }

    // 关闭现有连接并重置连接状态
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = undefined;
    }
    setIsConnected(false);

    // 切换 session 时清空消息和状态
    if (prevSessionId !== undefined) {
      setMessages([]);
      setFollowupQuestion(undefined);
      setConnectionError(undefined);
    }

    // 更新内部 sessionId 显示（用于历史消息加载）
    setSessionId(externalSessionId);
  }, [externalSessionId]);

  // 监听全局 localStorage 事件，确保“新建对话”即使重复点击也会触发重置
  useEffect(() => {
    const handler = (event: any) => {
      try {
        if (!event?.detail) return;
        const { key, value } = event.detail || {};
        if (key !== 'vines-ui-chat-session') return;

        // 仅当该 agentId 相关的会话选择被更新时处理
        const mapped = value || {};
        const target = mapped[agentId];
        lastStorageValueRef.current = mapped;

        if (target === '') {
          // 明确“新建对话”：无论 externalSessionId 是否变化，都强制重置一次
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          if (streamAbortRef.current) {
            streamAbortRef.current.abort();
            streamAbortRef.current = undefined;
          }
          setIsConnected(false);
          setIsLoading(false);
          setConnectionError(undefined);
          setMessages([]);
          setFollowupQuestion(undefined);
          setSessionId(undefined);
          currentSessionIdRef.current = undefined;
          creatingSessionRef.current = false;
        } else if (typeof target === 'string' && target) {
          // 切换到指定历史会话：清理流并设置内部 sessionId（用于加载历史）
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          if (streamAbortRef.current) {
            streamAbortRef.current.abort();
            streamAbortRef.current = undefined;
          }
          setIsConnected(false);
          setIsLoading(false);
          setConnectionError(undefined);
          setMessages([]);
          setFollowupQuestion(undefined);
          setSessionId(target);
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('mantine-local-storage', handler as any);
    return () => window.removeEventListener('mantine-local-storage', handler as any);
  }, [agentId]);

  // 不在选择会话时自动建立 SSE，等待用户发送消息再建立。

  // 更新消息列表
  useEffect(() => {
    // 如果没有消息响应，直接返回
    if (!messagesResponse) {
      return;
    }

    // 检查两种可能的响应格式
    const messages = (messagesResponse as any)?.messages || messagesResponse?.data?.messages;

    if (messages && messages.length > 0) {
      const historicalMessages: IAgentV2ChatMessage[] = messages.map((msg) => {
        // 根据API返回数据，isSystem为true表示助手消息，false表示用户消息
        const role = msg.isSystem ? 'assistant' : 'user';

        // 直接使用原始content，不做复杂转换
        const content = msg.content || '';

        const processedMessage = {
          id: msg.id,
          role,
          content,
          toolCalls: msg.toolCalls,
          createdAt: new Date(msg.createdTimestamp),
          senderId: msg.senderId,
          isSystem: msg.isSystem,
        };

        return processedMessage;
      });

      // 直接替换消息列表为历史消息（不追加到现有消息）
      setMessages(historicalMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
    }
  }, [messagesResponse]);

  // 处理 SSE 事件（放在前面，供下方回调依赖）
  const handleSSEEvent = useCallback((data: any) => {
    if (!data || !data.type) {
      return;
    }
    switch (data.type) {
      case 'session_start':
        break;

      case 'session_metadata':
        setSessionId(data.sessionId);
        currentSessionIdRef.current = data.sessionId;
        creatingSessionRef.current = false;

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
        // 为思考内容创建独立的消息气泡
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          // 检查最后一条消息是否是思考类型的流式消息
          if (
            lastMessage?.role === 'assistant' &&
            lastMessage.isStreaming &&
            (lastMessage as any).messageType === 'thinking'
          ) {
            // 更新现有的思考消息
            return [...prev.slice(0, -1), { ...lastMessage, content: (lastMessage.content || '') + data.content }];
          } else {
            // 创建新的思考消息气泡
            return [
              ...prev,
              {
                id: nanoIdLowerCase(),
                role: 'assistant',
                content: data.content,
                createdAt: new Date(),
                isStreaming: true,
                messageType: 'thinking', // 标记为思考类型
              },
            ];
          }
        });
        break;

      case 'tool_calls': {
        // 为每个工具调用创建独立的消息气泡
        const toolCalls = data.toolCalls || [];
        if (toolCalls.length > 0) {
          setMessages((prev) => {
            const newMessages: IAgentV2ChatMessage[] = [];

            // 为每个工具调用创建独立的消息气泡
            toolCalls.forEach((toolCall: any) => {
              const newMessage: IAgentV2ChatMessage = {
                id: nanoIdLowerCase(),
                role: 'assistant' as const,
                content: '', // 交由 ai-elements 组件处理显示
                createdAt: new Date(),
                isStreaming: true,
                messageType: 'tool_call',
                toolCalls: [toolCall],
              };
              newMessages.push(newMessage);
            });

            return [...prev, ...newMessages];
          });
        }
        break;
      }

      case 'tool_result': {
        // 为工具执行结果创建独立的消息气泡
        const { tool, result } = data;
        if (tool && result) {
          setMessages((prev) => {
            // 对于 attempt_completion 工具，直接创建最终回复消息
            if (tool.name === 'attempt_completion' && result.output) {
              const finalMessage: IAgentV2ChatMessage = {
                id: nanoIdLowerCase(),
                role: 'assistant' as const,
                content: result.output,
                createdAt: new Date(),
                isStreaming: false,
                messageType: 'final_response',
              };

              return [...prev, finalMessage];
            }

            // 对于其他工具，创建工具结果消息气泡
            const newMessage: IAgentV2ChatMessage = {
              id: nanoIdLowerCase(),
              role: 'assistant' as const,
              content: '',
              createdAt: new Date(),
              isStreaming: false,
              messageType: 'tool_result',
              toolCalls: [
                {
                  id: tool.id,
                  name: tool.name,
                  params: tool.params,
                  result: result.output,
                },
              ],
            };

            return [...prev, newMessage];
          });
        }
        break;
      }

      case 'tool_use':
        // 兼容旧格式（如果有）
        if (data.name === 'update_todo_list' && data.params?.todos) {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            const todoUpdateXml = `<update_todo_list><todos>${data.params.todos}</todos></update_todo_list>`;

            if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: (lastMessage.content || '') + todoUpdateXml,
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

      case 'followup_question':
        setFollowupQuestion({
          question: data.question,
          suggestions: data.suggestions,
        });
        break;

      case 'response_complete':
        setIsLoading(false);
        setMessages((prev) => {
          const updated = prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg));
          if (data.finalContent) {
            const summaryMessage: IAgentV2ChatMessage = {
              id: nanoIdLowerCase(),
              role: 'assistant' as const,
              content: data.finalContent,
              createdAt: new Date(),
              isStreaming: false,
              messageType: 'summary',
            };
            return [...updated, summaryMessage];
          }
          return updated;
        });
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
        break;

      default:
        break;
    }
  }, []);

  // 建立新会话的 SSE 连接（创建会话并流式响应）
  const establishConnection = useCallback(
    async (agentId: string, initialMessage: string) => {
      try {
        setConnectionError(undefined);
        setIsLoading(true);
        creatingSessionRef.current = true;

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
        // Start new fetch stream with abort support
        const controller = new AbortController();
        streamAbortRef.current = controller;
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
          signal: controller.signal,
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
                    /* empty */
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
    },
    [handleSSEEvent],
  );

  // 连接到已有会话的 SSE（可选：携带一条首消息）
  const attachSessionStream = useCallback(
    async (sessionId: string, firstMessage?: string) => {
      try {
        setConnectionError(undefined);
        if (firstMessage) setIsLoading(true);

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const teamId = getVinesTeamId();
        const token = getVinesToken();
        if (!token) throw new Error('No authentication token available');

        // Start continuation fetch stream with abort support
        const controller = new AbortController();
        streamAbortRef.current = controller;
        const response = await fetch(`/api/agent-v2/sessions/${sessionId}/continue/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(teamId && { 'x-monkeys-teamid': teamId }),
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(firstMessage ? { message: firstMessage } : {}),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body available');

        setIsConnected(true);

        const processStream = async () => {
          try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('event:')) continue;
                if (line.startsWith('data:')) {
                  const dataStr = line.substring(5).trim();
                  try {
                    const data = JSON.parse(dataStr);
                    handleSSEEvent(data);
                  } catch {
                    /* empty */
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
    },
    [handleSSEEvent],
  );

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

      // 判断当前使用哪个 session 或是否需要创建新 session
      // 逻辑：
      // 1. externalSessionId === '' 明确为“新建对话” → 强制创建新会话
      // 2. 如果有外部 session（非空字符串），使用外部 session
      // 3. 如果有内部 session，继续使用内部 session
      // 4. 否则创建新 session

      if (externalSessionId === '') {
        // 明确新建对话：忽略任何现有的内部会话引用
        creatingSessionRef.current = creatingSessionRef.current || false;
        currentSessionIdRef.current = undefined;
        if (!creatingSessionRef.current) {
          await establishConnection(agentId, content);
        } else {
          messageQueueRef.current.push(content);
        }
      } else if (externalSessionId && externalSessionId !== '') {
        // 情况1: 有明确的外部 session（从列表点击的）
        // 如果尚未连接SSE，则使用续接SSE接口并携带首条消息；否则走消息接口
        if (!isConnected) {
          await attachSessionStream(externalSessionId, content);
        } else {
          await sendMessageToSession(externalSessionId, content);
        }
      } else if (currentSessionIdRef.current) {
        // 情况2: 有内部创建的 session，继续使用
        await sendMessageToSession(currentSessionIdRef.current, content);
      } else {
        // 情况3: 创建新 session（首次对话或用户点击新建对话后）
        if (!creatingSessionRef.current) {
          await establishConnection(agentId, content);
        } else {
          // 正在创建会话，排队消息等待 session_metadata 到达后发送
          messageQueueRef.current.push(content);
        }
      }
    },
    [agentId, externalSessionId, establishConnection, isConnected, attachSessionStream],
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
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = undefined;
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
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = undefined;
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
