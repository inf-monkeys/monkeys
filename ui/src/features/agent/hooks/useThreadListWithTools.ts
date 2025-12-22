/**
 * useThreadListWithTools - Thread List + 工具支持
 * 使用 assistant-ui 标准格式，支持工具调用
 */

import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ExternalStoreAdapter,
  type ExternalStoreThreadData,
  type ExternalStoreThreadListAdapter,
  type TextMessagePart,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { threadApi } from '../api/agent-api';
import type { Message, Thread } from '../types/agent.types';

interface UseThreadListWithToolsOptions {
  teamId: string;
  userId: string;
  agentId?: string;
}

type MessagePart = ThreadMessageLike['content'] extends readonly (infer U)[] ? U : any;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 规范化消息内容为可变数组，保证不会返回 string
 */
function toContentParts(
  content: ThreadMessageLike['content'] | AppendMessage['content'] | Message['parts'],
): MessagePart[] {
  if (typeof content === 'string') {
    return [{ type: 'text', text: content } as MessagePart];
  }
  return [...content] as MessagePart[];
}

/**
 * 将后端 Message 转换为 ThreadMessageLike，容错 role 与 content
 */
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  const content = toContentParts(message.parts).map((part) => {
    if (part && typeof part === 'object' && 'type' in part) {
      return part;
    }
    return { type: 'text', text: JSON.stringify(part) } as MessagePart;
  });

  return {
    id: message.id,
    role: message.role || 'assistant',
    content,
    createdAt: new Date(message.createdTimestamp),
  };
}

/**
 * 将 Thread 转换为 ExternalStoreThreadData
 */
function convertThreadToThreadData(thread: Thread): ExternalStoreThreadData<'regular'> {
  return {
    id: thread.id,
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
  const pendingThreadCreationRef = useRef<Promise<string | null> | null>(null);

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

  // 确保存在可用的 thread（必要时自动创建）
  const ensureActiveThread = useCallback(async (): Promise<string | null> => {
    if (currentThreadId && threads.has(currentThreadId)) {
      return currentThreadId;
    }

    const existingThread = threads.values().next().value as Thread | undefined;
    if (existingThread?.id) {
      setCurrentThreadId(existingThread.id);
      return existingThread.id;
    }

    if (pendingThreadCreationRef.current) {
      return pendingThreadCreationRef.current;
    }

    const creationPromise = (async () => {
      try {
        const created = await createNewThread();
        return created.id;
      } catch (error) {
        console.error('[ThreadListWithTools] Failed to ensure active thread:', error);
        return null;
      } finally {
        pendingThreadCreationRef.current = null;
      }
    })();

    pendingThreadCreationRef.current = creationPromise;
    return creationPromise;
  }, [currentThreadId, threads, createNewThread]);

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

  const tryReloadMessagesUntilSaved = useCallback(
    async (threadId: string, minCount: number) => {
      // /chat 返回是流式，后端落库在后台任务里，存在短暂“拉回来的消息比本地少”的窗口。
      // 这里做轻量重试：只有当服务端消息数量 >= 本地数量时才覆盖本地，避免把 UI 上的 assistant 消息清空。
      const maxAttempts = 8;
      const baseDelayMs = 200;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const messageList = await threadApi.getMessages(threadId, teamId);
          const converted = messageList.map(convertMessageToThreadMessage);

          if (converted.length >= minCount) {
            setThreadMessages((prev) => new Map(prev).set(threadId, converted));
            return;
          }
        } catch (e) {
          // 网络/鉴权问题也不应覆盖本地消息
          console.warn('[ThreadListWithTools] Reload messages failed (will retry):', e);
        }

        // 线性回退即可（避免过度请求）
        await sleep(baseDelayMs * attempt);
      }

      // 最终仍未等到落库完成：保持本地消息即可
      console.warn('[ThreadListWithTools] Reload messages skipped (server not ready)');
    },
    [teamId],
  );

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

  // 当线程列表为空且加载完成时，自动确保一个可用线程
  useEffect(() => {
    if (!isLoadingThreads && !currentThreadId) {
      ensureActiveThread();
    }
  }, [isLoadingThreads, currentThreadId, ensureActiveThread]);

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
      const activeThreadId = await ensureActiveThread();
      if (!activeThreadId) {
        console.warn('[ThreadListWithTools] No active thread');
        return;
      }

      if (message.content.length !== 1 || message.content[0]?.type !== 'text') {
        throw new Error('Only text content is supported');
      }

      const userMessage: ThreadMessageLike = {
        role: 'user',
        content: toContentParts(message.content),
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      // 添加用户消息
      setThreadMessages((prev) => {
        const current = prev.get(activeThreadId) || [];
        return new Map(prev).set(activeThreadId, [...current, userMessage]);
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
        const response = await fetch(`/api/agents/threads/${activeThreadId}/chat`, {
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

        // 注意：threadMessages 这里是“触发 onNew 时的快照”，还没包含刚 append 的 user/assistant。
        // 本地最终会是 base + user + assistant，因此用 base + 2 作为“服务端落库完成”的最低消息数门槛。
        const baseMessagesCount = (threadMessages.get(activeThreadId) || []).length;
        const minMessagesCountAfterSaved = baseMessagesCount + 2;

        // 解析 AI SDK 标准流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const assistantId = `assistant-${Date.now()}`;
        let assistantMessage: ThreadMessageLike = {
          role: 'assistant',
          content: [] as MessagePart[],
          id: assistantId,
          createdAt: new Date(),
        };

        setThreadMessages((prev) => {
          const current = prev.get(activeThreadId) || [];
          return new Map(prev).set(activeThreadId, [...current, assistantMessage]);
        });

        const applyAssistantMessageUpdate = () => {
          setThreadMessages((prev) => {
            const current = prev.get(activeThreadId) || [];
            return new Map(prev).set(
              activeThreadId,
              current.map((m) => (m.id === assistantId ? assistantMessage : m)),
            );
          });
        };

        const processStreamLine = (rawLine: string) => {
          const line = rawLine.replace(/\r$/, '');
          if (!line.trim() || line.startsWith(':')) return;

          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) return;

          const eventType = line.substring(0, colonIndex);
          const data = line.substring(colonIndex + 1);

          // AI SDK 标准格式: "0:<json-string>\n", "9:<json-object>\n", etc.
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            // 兼容少数实现：0:hello（非 JSON 字符串）
            if (eventType === '0') {
              parsed = data;
            } else {
              console.warn('[ThreadListWithTools] Failed to parse stream data:', line, e);
              return;
            }
          }

          // 文本增量 (type "0")
          if (eventType === '0' && typeof parsed === 'string') {
            const currentContent = toContentParts(assistantMessage.content);
            const textIndex = currentContent.findIndex((c) => c.type === 'text');
            let nextContent: MessagePart[];

            if (textIndex >= 0) {
              const existing = currentContent[textIndex] as TextMessagePart;
              const updated: TextMessagePart = { ...existing, text: existing.text + parsed };
              nextContent = currentContent.map((c, i) =>
                i === textIndex ? (updated as MessagePart) : c,
              );
            } else {
              nextContent = [...currentContent, { type: 'text', text: parsed } as MessagePart];
            }

            assistantMessage = { ...assistantMessage, content: nextContent };
            applyAssistantMessageUpdate();
          }
          // 工具调用 (type "9")
          else if (eventType === '9') {
            console.log('[ThreadListWithTools] Tool call:', parsed);

            const currentContent = toContentParts(assistantMessage.content);
            const filtered = currentContent.filter(
              (c) => !(c.type === 'tool-call' && (c as any).toolCallId === parsed.toolCallId),
            );
            const toolCall = {
              type: 'tool-call' as const,
              toolCallId: parsed.toolCallId,
              toolName: parsed.toolName,
              args: parsed.args,
            } as MessagePart;
            const nextContent = [...filtered, toolCall];

            assistantMessage = { ...assistantMessage, content: nextContent };
            applyAssistantMessageUpdate();
          }
          // 工具结果 (type "a" or "b")
          else if (eventType === 'a' || eventType === 'b') {
            console.log('[ThreadListWithTools] Tool result:', parsed);

            const currentContent = toContentParts(assistantMessage.content);
            const filtered = currentContent.filter(
              (c) => !(c.type === 'tool-result' && (c as any).toolCallId === parsed.toolCallId),
            );
            const toolResult = {
              type: 'tool-result' as const,
              toolCallId: parsed.toolCallId,
              toolName: parsed.toolName,
              result: parsed.result,
              isError: parsed.isError || false,
            } as MessagePart;
            const nextContent = [...filtered, toolResult];

            assistantMessage = { ...assistantMessage, content: nextContent };
            applyAssistantMessageUpdate();
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processStreamLine(line);
          }
        }

        // 处理最后残留的 buffer（可能没有以 \n 结尾，导致整段内容都滞留在 buffer）
        if (buffer.trim()) {
          const tailLines = buffer.split('\n');
          for (const line of tailLines) {
            processStreamLine(line);
          }
          buffer = '';
        }

        // 流结束后：不要立刻用服务端消息覆盖本地（后端落库有延迟）
        console.log('[ThreadListWithTools] Stream complete, syncing messages (retry)');
        void tryReloadMessagesUntilSaved(activeThreadId, minMessagesCountAfterSaved);
      } catch (error) {
        console.error('[ThreadListWithTools] Stream error:', error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [ensureActiveThread, teamId, userId, agentId, threadMessages, tryReloadMessagesUntilSaved],
  );

  // 创建 ThreadListAdapter
  const threadListAdapter: ExternalStoreAdapter<ThreadMessageLike> = useMemo(() => {
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
      isRunning,
      messages: currentMessages,
      onNew,
      onReload: async () => {
        await loadMessages();
      },
      onCancel: async () => {
        setIsRunning(false);
      },
      convertMessage: (message) => ({
        role: message.role || 'assistant',
        content: toContentParts(message.content) as ThreadMessageLike['content'],
        id: message.id ?? `msg-${Date.now()}`,
        createdAt: message.createdAt ?? new Date(),
      }),
      adapters: {
        threadList: {
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
        } satisfies ExternalStoreThreadListAdapter,
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
