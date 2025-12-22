/**
 * useAssistantUIAdapter - 使用 assistant-ui 标准适配器
 * 对接后端的 /chat 端点（支持工具调用）
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  type ExternalStoreAdapter,
} from '@assistant-ui/react';
import { threadApi } from '../api/agent-api';
import type { Message } from '../types/agent.types';

interface UseAssistantUIAdapterOptions {
  teamId: string;
  userId: string;
  agentId?: string;
  threadId: string | null;
}

/**
 * 将后端 Message 转换为 assistant-ui ThreadMessageLike
 *
 * 关键转换:
 * - 将独立的 tool-result 合并到对应的 tool-call 中
 * - assistant-ui 不支持独立的 tool-result,result 应该是 tool-call 的属性
 */
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  console.log('[convertMessage] Processing message:', message.id, 'role:', message.role);
  console.log('[convertMessage] Original parts:', JSON.stringify(message.parts, null, 2));

  // 先收集所有 tool-result (按 toolCallId 索引)
  const toolResultsMap = new Map<string, any>();

  message.parts.forEach((part) => {
    if (part && typeof part === 'object' && 'type' in part && part.type === 'tool-result') {
      const toolResult = part as any;
      if (toolResult.toolCallId) {
        console.log('[convertMessage] Found tool-result:', toolResult.toolCallId);
        toolResultsMap.set(toolResult.toolCallId, {
          result: toolResult.result,
          isError: toolResult.isError,
        });
      }
    }
  });

  // 转换 parts,跳过 tool-result,将其合并到 tool-call 中
  const content = message.parts
    .filter((part) => {
      // 过滤掉独立的 tool-result
      if (part && typeof part === 'object' && 'type' in part && part.type === 'tool-result') {
        console.log('[convertMessage] Filtering out tool-result');
        return false;
      }
      return true;
    })
    .map((part) => {
      if (part && typeof part === 'object' && 'type' in part) {
        // 如果是 tool-call,尝试合并对应的 tool-result
        if (part.type === 'tool-call') {
          const toolCall = part as any;
          const toolCallId = toolCall.toolCallId;

          if (toolCallId && toolResultsMap.has(toolCallId)) {
            const resultData = toolResultsMap.get(toolCallId);
            console.log('[convertMessage] Merging result into tool-call:', toolCallId);
            return {
              ...toolCall,
              result: resultData.result,
              isError: resultData.isError,
            };
          }
        }
        return part;
      }
      return {
        type: 'text' as const,
        text: typeof part === 'string' ? part : JSON.stringify(part),
      };
    });

  console.log('[convertMessage] Final content:', JSON.stringify(content, null, 2));

  return {
    id: message.id,
    role: message.role as 'assistant' | 'user' | 'system',
    content,
    createdAt: new Date(message.createdTimestamp),
  };
}

/**
 * 使用 assistant-ui 标准适配器
 */
export function useAssistantUIAdapter(options: UseAssistantUIAdapterOptions) {
  const { teamId, userId, agentId, threadId } = options;

  // 消息状态
  const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 加载消息
  const loadMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    try {
      const messageList = await threadApi.getMessages(threadId, teamId);
      console.log('[AssistantUI] Loaded messages:', messageList.length);
      const converted = messageList.map(convertMessageToThreadMessage);
      setMessages(converted);
    } catch (error) {
      console.error('[AssistantUI] Failed to load messages:', error);
    }
  }, [threadId, teamId]);

  // 初始加载
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 发送消息
  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!threadId) {
        console.warn('[AssistantUI] No active thread');
        return;
      }

      if (message.content.length !== 1 || message.content[0]?.type !== 'text') {
        throw new Error('Only text content is supported');
      }

      const userMessage: ThreadMessageLike = {
        role: 'user',
        content: message.content,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      // 添加用户消息
      setMessages((prev) => [...prev, userMessage]);
      setIsRunning(true);

      try {
        const token = localStorage.getItem('vines-token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // 调用支持工具的 /chat 端点
        const response = await fetch(`/api/agents/threads/${threadId}/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            teamId,
            userId,
            agentId,
            messages: [
              {
                role: 'user',
                content: message.content[0].text,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // 使用 AI SDK 的标准流式响应格式
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const assistantId = `assistant-${Date.now()}`;
        let assistantMessage: ThreadMessageLike = {
          role: 'assistant',
          content: [],
          id: assistantId,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;

            // AI SDK 标准格式: "0:text\n", "2:tool_call\n" etc.
            const parts = line.split(':');
            if (parts.length < 2) continue;

            const eventType = parts[0];
            const data = parts.slice(1).join(':');

            try {
              const parsed = JSON.parse(data);

              // 处理文本增量
              if (eventType === '0' && typeof parsed === 'string') {
                const contentArray = Array.isArray(assistantMessage.content)
                  ? assistantMessage.content
                  : [];
                const textContent = contentArray.find((c) => c.type === 'text');

                if (textContent && 'text' in textContent) {
                  textContent.text += parsed;
                } else {
                  contentArray.push({ type: 'text', text: parsed });
                }

                assistantMessage = {
                  ...assistantMessage,
                  content: contentArray,
                };

                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? assistantMessage : m)),
                );
              }
              // 处理工具调用
              else if (eventType === '9' || parsed.type === 'tool-call') {
                console.log('[AssistantUI] Tool call event:', parsed);

                const contentArray = Array.isArray(assistantMessage.content)
                  ? assistantMessage.content
                  : [];

                const toolCall = {
                  type: 'tool-call' as const,
                  toolCallId: parsed.toolCallId,
                  toolName: parsed.toolName,
                  args: parsed.args,
                };

                // 移除旧的 tool-call (如果存在)
                const filteredContent = contentArray.filter(
                  (c) => !(c.type === 'tool-call' && (c as any).toolCallId === parsed.toolCallId),
                );
                filteredContent.push(toolCall);

                assistantMessage = {
                  ...assistantMessage,
                  content: filteredContent,
                };

                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? assistantMessage : m)),
                );
              }
              // 处理工具结果 - 更新现有 tool-call 的 result 字段
              else if (eventType === 'a' || parsed.type === 'tool-result') {
                console.log('[AssistantUI] Tool result event:', parsed);

                const contentArray = Array.isArray(assistantMessage.content)
                  ? assistantMessage.content
                  : [];

                // 找到对应的 tool-call 并更新其 result
                const updatedContent = contentArray.map((c) => {
                  if (c.type === 'tool-call' && (c as any).toolCallId === parsed.toolCallId) {
                    return {
                      ...c,
                      result: parsed.result,
                      isError: parsed.isError || false,
                    };
                  }
                  return c;
                });

                assistantMessage = {
                  ...assistantMessage,
                  content: updatedContent,
                };

                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? assistantMessage : m)),
                );
              }
            } catch (e) {
              console.warn('[AssistantUI] Failed to parse stream data:', line, e);
            }
          }
        }

        // 流结束后重新加载完整消息（确保与服务器同步）
        await loadMessages();
      } catch (error) {
        console.error('[AssistantUI] Stream error:', error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [threadId, teamId, userId, agentId, loadMessages],
  );

  // 创建 adapter
  const adapter: ExternalStoreAdapter = useMemo(
    () => ({
      isRunning,
      messages,
      setMessages,
      onNew,
      onEdit: async () => {
        throw new Error('Edit not supported');
      },
      onReload: async () => {
        await loadMessages();
      },
      onCancel: async () => {
        setIsRunning(false);
      },
      convertMessage: async (message) => {
        return {
          role: message.role,
          content: message.content,
        };
      },
    }),
    [isRunning, messages, onNew, loadMessages],
  );

  const runtime = useExternalStoreRuntime(adapter);

  return {
    runtime,
    messages,
    isRunning,
    loadMessages,
  };
}
