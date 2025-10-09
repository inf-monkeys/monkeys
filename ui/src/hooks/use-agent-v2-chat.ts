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

  // EventSource reference
  const eventSourceRef = useRef<EventSource>();
  const messageQueueRef = useRef<string[]>([]);
  const currentSessionIdRef = useRef<string>();

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

  useEffect(() => {
    // 只在 externalSessionId 真正改变时才处理（排除初始化和相同值）
    if (externalSessionId === prevExternalSessionIdRef.current) {
      return;
    }

    const prevSessionId = prevExternalSessionIdRef.current;
    prevExternalSessionIdRef.current = externalSessionId;

    // 如果是初始化（undefined -> ''），不做任何处理
    if (prevSessionId === undefined && externalSessionId === '') {
      setSessionId(externalSessionId);
      return;
    }

    // 关闭现有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setIsConnected(false);
    }

    // 判断是否切换了session（任何情况的切换都需要清空消息）
    const isSessionChanged = prevSessionId !== externalSessionId;

    // 切换session时清空消息和状态
    if (isSessionChanged && prevSessionId !== undefined) {
      setMessages([]);
      setFollowupQuestion(undefined);
      setConnectionError(undefined);
    }

    // 更新sessionId为外部提供的ID
    setSessionId(externalSessionId);

    // 如果是新建对话（空字符串），重置内部session引用
    if (externalSessionId === '') {
      currentSessionIdRef.current = undefined;
    }
  }, [externalSessionId]);

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

  // 建立 SSE 连接
  const establishConnection = useCallback(async (agentId: string, initialMessage: string) => {
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
  }, []);

  // 处理 SSE 事件
  const handleSSEEvent = useCallback((data: any) => {
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
        // 为思考内容创建独立的消息气泡
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];

          // 检查最后一条消息是否是思考类型的流式消息
          if (lastMessage?.role === 'assistant' && lastMessage.isStreaming && lastMessage.messageType === 'thinking') {
            // 更新现有的思考消息
            return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.content }];
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
            toolCalls.forEach((toolCall) => {
              const newMessage: IAgentV2ChatMessage = {
                id: nanoIdLowerCase(),
                role: 'assistant' as const,
                content: '', // 移除前端添加的文字，让ai-elements组件处理显示
                createdAt: new Date(),
                isStreaming: true,
                messageType: 'tool_call', // 标记为工具调用类型
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
                content: result.output, // 直接使用 result 作为消息内容
                createdAt: new Date(),
                isStreaming: false,
                messageType: 'final_response', // 标记为最终回复类型
              };

              return [...prev, finalMessage];
            }

            // 对于其他工具，创建工具结果消息气泡
            const newMessage: IAgentV2ChatMessage = {
              id: nanoIdLowerCase(),
              role: 'assistant' as const,
              content: '', // 移除前端添加的文字，让ai-elements组件处理显示
              createdAt: new Date(),
              isStreaming: false, // 工具结果是完整的，不需要流式更新
              messageType: 'tool_result', // 标记为工具结果类型
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
        // 保持对旧格式的兼容性
        if (data.name === 'update_todo_list' && data.params?.todos) {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];

            if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
              const todoUpdateXml = `<update_todo_list><todos>${data.params.todos}</todos></update_todo_list>`;

              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + todoUpdateXml,
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

      case 'followup_question':
        setFollowupQuestion({
          question: data.question,
          suggestions: data.suggestions,
        });
        break;

      case 'response_complete':
        setIsLoading(false);

        // 标记所有流式消息完成，并创建最终总结消息气泡（如果有内容的话）
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg));

          // 如果有最终的总结内容，创建总结消息气泡
          if (data.finalContent) {
            const summaryMessage: IAgentV2ChatMessage = {
              id: nanoIdLowerCase(),
              role: 'assistant' as const,
              content: data.finalContent,
              createdAt: new Date(),
              isStreaming: false,
              messageType: 'summary', // 标记为总结类型
            };

            return [...updatedMessages, summaryMessage];
          }

          return updatedMessages;
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
        // 显示心跳事件，不过滤
        console.log('收到心跳事件:', data);
        break;

      default:
        break;
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

      // 判断当前使用哪个 session 或是否需要创建新 session
      // 逻辑：
      // 1. 如果有外部 session（非空字符串），使用外部 session
      // 2. 如果有内部 session，继续使用内部 session
      // 3. 否则创建新 session

      if (externalSessionId && externalSessionId !== '') {
        // 情况1: 有明确的外部 session（从列表点击的）
        await sendMessageToSession(externalSessionId, content);
      } else if (currentSessionIdRef.current) {
        // 情况2: 有内部创建的 session，继续使用
        await sendMessageToSession(currentSessionIdRef.current, content);
      } else {
        // 情况3: 创建新 session（首次对话或用户点击新建对话后）
        await establishConnection(agentId, content);
      }
    },
    [agentId, externalSessionId, establishConnection],
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
