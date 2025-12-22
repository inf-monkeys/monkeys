/**
 * useThreadListWithTools - Thread List + 工具支持
 * 使用 assistant-ui 标准格式，支持工具调用
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  type ExternalStoreThreadListAdapter,
  type ExternalStoreThreadData,
} from '@assistant-ui/react';
import { threadApi } from '../api/agent-api';
import type { Thread, Message } from '../types/agent.types';

interface UseThreadListWithToolsOptions {
  teamId: string;
  userId: string;
  agentId?: string;
}

/**
 * 将后端 Message 转换为 ThreadMessageLike
 */
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  const content = message.parts.map((part) => {
    if (part && typeof part === 'object' && 'type' in part) {
      return part;
    }
    return {
      type: 'text' as const,
      text: typeof part === 'string' ? part : JSON.stringify(part),
    };
  });

  return {
    id: message.id,
    role: message.role,
    content,
    createdAt: new Date(message.createdTimestamp),
  };
}

/**
 * 将 Thread 转换为 ExternalStoreThreadData
 */
function convertThreadToThreadData(thread: Thread): ExternalStoreThreadData {
  return {
    threadId: thread.id,
    title: thread.title || 'New Chat',
    status: 'regular',
  };
}

export function useThreadListWithTools(options: UseThreadListWithToolsOptions) {
  const { teamId, userId, agentId } = options;

  // Thread 列表状态
  const [threads, setThreads] = useState<Map<string, Thread>>(new Map());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Map<string, ThreadMessageLike[]>>(
    new Map(),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  const isInitializedRef = useRef(false);

  // 加载 thread 列表
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const threadList = await threadApi.listThreads(teamId, userId, agentId);
      console.log('[ThreadListWithTools] Fetched threads:', threadList.length);

      const threadMap = new Map(threadList.map((t) => [t.id, t]));
      setThreads(threadMap);

      // 如果没有当前 thread 或当前 thread 不存在，选择第一个
      setCurrentThreadId((prevId) => {
        if (!prevId || !threadMap.has(prevId)) {
          const firstThread = threadList[0];
          return firstThread?.id || null;
        }
        return prevId;
      });
    } catch (error) {
      console.error('[ThreadListWithTools] Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [teamId, userId, agentId]);

  // 加载当前 thread 的消息
  const loadMessages = useCallback(async () => {
    if (!currentThreadId) {
      setThreadMessages((prev) => new Map(prev).set('', []));
      return;
    }

    try {
      const messageList = await threadApi.getMessages(currentThreadId, teamId);
      console.log('[ThreadListWithTools] Loaded messages:', messageList.length);

      const converted = messageList.map(convertMessageToThreadMessage);
      setThreadMessages((prev) => new Map(prev).set(currentThreadId, converted));
    } catch (error) {
      console.error('[ThreadListWithTools] Failed to load messages:', error);
    }
  }, [currentThreadId, teamId]);

  // 初始化
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      loadThreads();
    }
  }, [loadThreads]);

  // 当前 thread 变化时加载消息
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 创建新 thread
  const createNewThread = useCallback(async (): Promise<Thread> => {
    const newThread = await threadApi.createThread(teamId, userId, {
      agentId,
      title: 'New Chat',
    });

    setThreads((prev) => new Map(prev).set(newThread.id, newThread));
    setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
    setCurrentThreadId(newThread.id);

    return newThread;
  }, [teamId, userId, agentId]);

  // 切换 thread
  const switchToThread = useCallback(async (threadId: string) => {
    console.log('[ThreadListWithTools] Switching to thread:', threadId);
    setCurrentThreadId(threadId);
  }, []);

  // 删除 thread
  const deleteThread = useCallback(
    async (threadId: string) => {
      await threadApi.deleteThread(threadId, teamId);

      setThreads((prev) => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });

      setThreadMessages((prev) => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });

      setCurrentThreadId((prevId) => {
        if (prevId === threadId) {
          const remainingThreads = Array.from(threads.values()).filter((t) => t.id !== threadId);
          return remainingThreads[0]?.id || null;
        }
        return prevId;
      });
    },
    [teamId, threads],
  );

  // 发送新消息（使用支持工具的 /chat 端点）
  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!currentThreadId) {
        console.warn('[ThreadListWithTools] No active thread');
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
      setThreadMessages((prev) => {
        const current = prev.get(currentThreadId) || [];
        return new Map(prev).set(currentThreadId, [...current, userMessage]);
      });

      setIsRunning(true);

      try {
        const token = localStorage.getItem('vines-token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('[ThreadListWithTools] Sending message to /chat endpoint');

        // 调用支持工具的 /chat 端点
        const response = await fetch(`/api/agents/threads/${currentThreadId}/chat`, {
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

        // 解析 AI SDK 标准流式响应
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

        setThreadMessages((prev) => {
          const current = prev.get(currentThreadId) || [];
          return new Map(prev).set(currentThreadId, [...current, assistantMessage]);
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;

            // AI SDK 标准格式: "0:text\n", "9:{...tool-call...}\n", etc.
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const eventType = line.substring(0, colonIndex);
            const data = line.substring(colonIndex + 1);

            try {
              const parsed = JSON.parse(data);

              // 文本增量 (type "0")
              if (eventType === '0' && typeof parsed === 'string') {
                const textContent = assistantMessage.content.find((c) => c.type === 'text');
                if (textContent && 'text' in textContent) {
                  textContent.text += parsed;
                } else {
                  assistantMessage.content.push({ type: 'text', text: parsed });
                }

                setThreadMessages((prev) => {
                  const current = prev.get(currentThreadId) || [];
                  return new Map(prev).set(
                    currentThreadId,
                    current.map((m) => (m.id === assistantId ? { ...assistantMessage } : m)),
                  );
                });
              }
              // 工具调用 (type "9")
              else if (eventType === '9') {
                console.log('[ThreadListWithTools] Tool call:', parsed);

                const toolCall = {
                  type: 'tool-call' as const,
                  toolCallId: parsed.toolCallId,
                  toolName: parsed.toolName,
                  args: parsed.args,
                };

                // 移除旧的同 ID tool-call（如果存在）
                assistantMessage.content = assistantMessage.content.filter(
                  (c) => !(c.type === 'tool-call' && (c as any).toolCallId === parsed.toolCallId),
                );
                assistantMessage.content.push(toolCall);

                setThreadMessages((prev) => {
                  const current = prev.get(currentThreadId) || [];
                  return new Map(prev).set(
                    currentThreadId,
                    current.map((m) => (m.id === assistantId ? { ...assistantMessage } : m)),
                  );
                });
              }
              // 工具结果 (type "a" or "b")
              else if (eventType === 'a' || eventType === 'b') {
                console.log('[ThreadListWithTools] Tool result:', parsed);

                const toolResult = {
                  type: 'tool-result' as const,
                  toolCallId: parsed.toolCallId,
                  toolName: parsed.toolName,
                  result: parsed.result,
                  isError: parsed.isError || false,
                };

                assistantMessage.content = assistantMessage.content.filter(
                  (c) =>
                    !(c.type === 'tool-result' && (c as any).toolCallId === parsed.toolCallId),
                );
                assistantMessage.content.push(toolResult);

                setThreadMessages((prev) => {
                  const current = prev.get(currentThreadId) || [];
                  return new Map(prev).set(
                    currentThreadId,
                    current.map((m) => (m.id === assistantId ? { ...assistantMessage } : m)),
                  );
                });
              }
            } catch (e) {
              console.warn('[ThreadListWithTools] Failed to parse stream data:', line, e);
            }
          }
        }

        // 流结束后重新加载完整消息
        console.log('[ThreadListWithTools] Stream complete, reloading messages');
        await loadMessages();
      } catch (error) {
        console.error('[ThreadListWithTools] Stream error:', error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [currentThreadId, teamId, userId, agentId, loadMessages],
  );

  // 创建 ThreadListAdapter
  const threadListAdapter: ExternalStoreThreadListAdapter = useMemo(() => {
    const validThreadId =
      isLoadingThreads || !currentThreadId || !threads.has(currentThreadId)
        ? undefined
        : currentThreadId;

    const threadDataArray = Array.from(threads.values()).map(convertThreadToThreadData);

    const currentMessages = validThreadId ? threadMessages.get(validThreadId) || [] : [];

    console.log('[ThreadListWithTools] Adapter update:', {
      validThreadId,
      threadsCount: threads.size,
      messagesCount: currentMessages.length,
      isRunning,
    });

    return {
      threadId: validThreadId,
      threads: threadDataArray,
      archivedThreads: [],

      onSwitchToNewThread: async () => {
        console.log('[ThreadListWithTools] Creating new thread');
        await createNewThread();
      },

      onSwitchToThread: async (threadId: string) => {
        console.log('[ThreadListWithTools] Switching to thread:', threadId);
        await switchToThread(threadId);
      },

      onRename: async (threadId: string, newTitle: string) => {
        await threadApi.updateThread(threadId, teamId, { title: newTitle });
        setThreads((prev) => {
          const thread = prev.get(threadId);
          if (thread) {
            return new Map(prev).set(threadId, { ...thread, title: newTitle });
          }
          return prev;
        });
      },

      onArchive: async () => {
        // TODO: 实现归档
      },

      onUnarchive: async () => {
        // TODO: 实现取消归档
      },

      onDelete: async (threadId: string) => {
        console.log('[ThreadListWithTools] Deleting thread:', threadId);
        await deleteThread(threadId);
      },

      isRunning,
      messages: currentMessages,
      onNew,
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
    };
  }, [
    threads,
    currentThreadId,
    threadMessages,
    isRunning,
    isLoadingThreads,
    teamId,
    createNewThread,
    switchToThread,
    deleteThread,
    onNew,
    loadMessages,
  ]);

  const runtime = useExternalStoreRuntime(threadListAdapter);

  return {
    runtime,
    threads: Array.from(threads.values()),
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread: createNewThread,
    deleteThread,
  };
}
