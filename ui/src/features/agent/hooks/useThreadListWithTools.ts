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
  // Canvas context provider (optional, for tldraw integration)
  getCanvasData?: () => any;
  getSelectedShapeIds?: () => string[];
  getViewport?: () => { x: number; y: number; zoom: number };
}

type MessagePart = ThreadMessageLike['content'] extends readonly (infer U)[] ? U : any;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveThreadTitleFromText(text: string): string | null {
  const normalized = (text || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  const maxLen = 32;
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}…` : normalized;
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
 *
 * 关键转换:
 * - 将独立的 tool-result 合并到对应的 tool-call 中
 * - assistant-ui 不支持独立的 tool-result,result 应该是 tool-call 的属性
 */
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  // 先收集所有 tool-result (按 toolCallId 索引)
  const toolResultsMap = new Map<string, any>();

  const parts = toContentParts(message.parts);
  parts.forEach((part) => {
    if (part && typeof part === 'object' && 'type' in part && part.type === 'tool-result') {
      const toolResult = part as any;
      if (toolResult.toolCallId) {
        toolResultsMap.set(toolResult.toolCallId, {
          result: toolResult.result,
          isError: toolResult.isError,
        });
      }
    }
  });

  // 转换 parts: 过滤掉独立的 tool-result,将其合并到 tool-call 中
  const content = parts
    .filter((part) => {
      // 过滤掉独立的 tool-result
      if (part && typeof part === 'object' && 'type' in part && part.type === 'tool-result') {
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
            return {
              ...toolCall,
              result: resultData.result,
              isError: resultData.isError,
            };
          }
        }
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
  const { teamId, userId, agentId, getCanvasData, getSelectedShapeIds, getViewport } = options;

  // Thread 列表状态
  const [threads, setThreads] = useState<Map<string, Thread>>(new Map());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Map<string, ThreadMessageLike[]>>(
    new Map(),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [hasLoadedThreadsOnce, setHasLoadedThreadsOnce] = useState(false);
  const pendingThreadCreationRef = useRef<Promise<string | null> | null>(null);

  const isInitializedRef = useRef(false);

  const getThreadSortKey = useCallback((t: Thread): number => {
    const candidates = [t.lastMessageAt, t.updatedTimestamp, t.createdTimestamp].filter(Boolean) as string[];
    for (const c of candidates) {
      const ms = Date.parse(c);
      if (!Number.isNaN(ms)) return ms;
    }
    return 0;
  }, []);

  const sortedThreads = useMemo(() => {
    const arr = Array.from(threads.values());
    arr.sort((a, b) => getThreadSortKey(b) - getThreadSortKey(a));
    return arr;
  }, [threads, getThreadSortKey]);

  const findEmptyThreadId = useCallback((threadMap: Map<string, Thread>): string | null => {
    // 依然按“最新优先”的顺序去找空白 thread（更符合用户直觉）
    const values = Array.from(threadMap.values()).sort((a, b) => getThreadSortKey(b) - getThreadSortKey(a));
    for (const t of values) {
      if ((t.messageCount ?? 0) === 0) return t.id;
    }
    return null;
  }, [getThreadSortKey]);

  // 加载 thread 列表
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const threadList = await threadApi.listThreads(teamId, userId, agentId);
      console.log('[ThreadListWithTools] Fetched threads:', threadList.length);

      // 先用服务端返回构造 map
      const threadMap = new Map<string, Thread>(threadList.map((t) => [t.id, t]));

      // ✅ 刷新策略（按需求）：
      // - 有“空白会话（messageCount=0）”就复用它
      // - 否则创建新的 New Chat
      let nextThreadId: string | null = findEmptyThreadId(threadMap);

      if (!nextThreadId) {
        const newThread = await threadApi.createThread(teamId, userId, {
          agentId,
          title: 'New Chat',
        });
        // 约定：新建 thread 视为 messageCount=0
        threadMap.set(newThread.id, { ...newThread, messageCount: 0 });
        setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
        nextThreadId = newThread.id;
      }

      setThreads(threadMap);
      setCurrentThreadId(nextThreadId);
    } catch (error) {
      console.error('[ThreadListWithTools] Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
      setHasLoadedThreadsOnce(true);
    }
  }, [teamId, userId, agentId, findEmptyThreadId]);

  // 创建新 thread
  const createNewThread = useCallback(async (): Promise<Thread> => {
    const newThread = await threadApi.createThread(teamId, userId, {
      agentId,
      title: 'New Chat',
    });

    setThreads((prev) => new Map(prev).set(newThread.id, { ...newThread, messageCount: 0 }));
    setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
    setCurrentThreadId(newThread.id);

    return newThread;
  }, [teamId, userId, agentId]);

  // 确保存在可用的 thread（必要时自动创建）
  const ensureActiveThread = useCallback(async (): Promise<string | null> => {
    if (currentThreadId && threads.has(currentThreadId)) {
      return currentThreadId;
    }

    // 优先复用空白 thread
    const emptyThreadId = findEmptyThreadId(threads);
    if (emptyThreadId) {
      setCurrentThreadId(emptyThreadId);
      return emptyThreadId;
    }

    // 其次复用任意已有 thread
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
  }, [currentThreadId, threads, createNewThread, findEmptyThreadId]);

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
    // 避免竞态：必须等首次 loadThreads 完成后再做兜底创建
    if (hasLoadedThreadsOnce && !isLoadingThreads && !currentThreadId) {
      ensureActiveThread();
    }
  }, [hasLoadedThreadsOnce, isLoadingThreads, currentThreadId, ensureActiveThread]);

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

      // 自动改名：仅在“首条用户消息”且标题为空/默认时触发
      const existingMessages = threadMessages.get(activeThreadId) || [];
      const activeThread = threads.get(activeThreadId);
      if (
        existingMessages.length === 0 &&
        activeThread &&
        (!activeThread.title || activeThread.title === 'New Chat')
      ) {
        const newTitle = deriveThreadTitleFromText(message.content[0].text);
        if (newTitle) {
          // 先乐观更新本地，避免刷新前看不到变化
          setThreads((prev) => {
            const t = prev.get(activeThreadId);
            if (!t) return prev;
            return new Map(prev).set(activeThreadId, { ...t, title: newTitle });
          });

          // 异步写回服务端
          void threadApi
            .updateThread(activeThreadId, teamId, { title: newTitle })
            .catch((e) => console.warn('[ThreadListWithTools] Auto-rename failed:', e));
        }
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

      // 本地标记该 thread 已非空（用于后续空白复用判断）
      setThreads((prev) => {
        const t = prev.get(activeThreadId);
        if (!t) return prev;
        const nowIso = new Date().toISOString();
        const nextCount = (t.messageCount ?? 0) + 1;
        // 同步更新 lastMessageAt/updatedTimestamp，让当前对话在列表中即时置顶（无需刷新）
        return new Map(prev).set(activeThreadId, {
          ...t,
          messageCount: nextCount,
          lastMessageAt: nowIso,
          updatedTimestamp: nowIso,
        });
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

        // 获取 canvas 数据（如果是 tldraw-assistant）
        const canvasData = agentId === 'tldraw-assistant' && getCanvasData ? getCanvasData() : undefined;
        const selectedShapeIds = agentId === 'tldraw-assistant' && getSelectedShapeIds ? getSelectedShapeIds() : undefined;
        const viewport = agentId === 'tldraw-assistant' && getViewport ? getViewport() : undefined;

        if (canvasData) {
          console.log('[ThreadListWithTools] Including canvas context:', {
            shapesCount: canvasData.shapes?.length || 0,
            selectedCount: selectedShapeIds?.length || 0,
            viewport,
          });
        }

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
            // Canvas context for tldraw-assistant
            canvasData,
            selectedShapeIds,
            viewport,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const contentType = response.headers.get('content-type') || '';
        const isPlainTextStream = contentType.includes('text/plain');

        // 注意：threadMessages 这里是“触发 onNew 时的快照”，还没包含刚 append 的 user/assistant。
        // 本地最终会是 base + user + assistant，因此用 base + 2 作为“服务端落库完成”的最低消息数门槛。
        const baseMessagesCount = existingMessages.length;
        const minMessagesCountAfterSaved = baseMessagesCount + 2;

        // 解析流式响应：
        // - text/plain: utf-8 文本增量（AI SDK v6 的 toTextStreamResponse）
        // - 其它：沿用旧的 “eventType:json” 行协议解析（兼容历史实现）
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
          // 工具结果 (type "a" or "b") - 更新现有 tool-call 的 result 字段
          else if (eventType === 'a' || eventType === 'b') {
            console.log('[ThreadListWithTools] Tool result:', parsed);

            const currentContent = toContentParts(assistantMessage.content);

            // 找到对应的 tool-call 并更新其 result
            const nextContent = currentContent.map((c) => {
              if (c.type === 'tool-call' && (c as any).toolCallId === parsed.toolCallId) {
                return {
                  ...c,
                  result: parsed.result,
                  isError: parsed.isError || false,
                } as MessagePart;
              }
              return c;
            });

            assistantMessage = { ...assistantMessage, content: nextContent };
            applyAssistantMessageUpdate();
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });

          if (isPlainTextStream) {
            // 直接把 chunk 当成文本增量追加（无需等待换行）
            if (chunkText) {
              const currentContent = toContentParts(assistantMessage.content);
              const textIndex = currentContent.findIndex((c) => c.type === 'text');
              let nextContent: MessagePart[];

              if (textIndex >= 0) {
                const existing = currentContent[textIndex] as TextMessagePart;
                const updated: TextMessagePart = { ...existing, text: existing.text + chunkText };
                nextContent = currentContent.map((c, i) => (i === textIndex ? (updated as MessagePart) : c));
              } else {
                nextContent = [...currentContent, { type: 'text', text: chunkText } as MessagePart];
              }

              assistantMessage = { ...assistantMessage, content: nextContent };
              applyAssistantMessageUpdate();
            }
            continue;
          }

          buffer += chunkText;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processStreamLine(line);
          }
        }

        // 处理最后残留的 buffer（可能没有以 \n 结尾）
        if (!isPlainTextStream && buffer.trim()) {
          const tailLines = buffer.split('\n');
          for (const line of tailLines) processStreamLine(line);
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
    [ensureActiveThread, teamId, userId, agentId, threadMessages, tryReloadMessagesUntilSaved, getCanvasData, getSelectedShapeIds, getViewport],
  );

  // 创建 ThreadListAdapter
  const threadListAdapter: ExternalStoreAdapter<ThreadMessageLike> = useMemo(() => {
    const validThreadId =
      isLoadingThreads || !currentThreadId || !threads.has(currentThreadId)
        ? undefined
        : currentThreadId;

    const threadDataArray = sortedThreads.map(convertThreadToThreadData);

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
    sortedThreads,
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
    threads: sortedThreads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread: createNewThread,
    deleteThread,
  };
}
