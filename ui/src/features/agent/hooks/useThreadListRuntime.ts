/**
 * useThreadListRuntime - 实现 assistant-ui ThreadListRuntime
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  type ExternalStoreThreadListAdapter,
  type ExternalStoreThreadData,
} from '@assistant-ui/react';
import { threadApi, chatApi } from '../api/agent-api';
import type { Thread, Message } from '../types/agent.types';

interface UseThreadListRuntimeOptions {
  teamId: string;
  userId: string;
  agentId?: string;
}

/**
 * 将 Message 转换为 ThreadMessageLike
 * 确保 content 格式正确
 */
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  // 确保 parts 数组中的每个元素都有 type 字段
  const content = message.parts.map((part) => {
    // 如果 part 已经有完整的 type,直接返回
    if (part && typeof part === 'object' && 'type' in part) {
      return part;
    }
    // 否则,包装为 text type
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
    status: 'regular', // 如果需要支持 archived,可以从 thread.metadata 中读取
  };
}

function deriveThreadTitleFromText(text: string): string | null {
  const normalized = (text || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  const maxLen = 32;
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}…` : normalized;
}

/**
 * 使用 ExternalStoreRuntime 实现 ThreadListRuntime
 */
export function useThreadListRuntime(options: UseThreadListRuntimeOptions) {
  const { teamId, userId, agentId } = options;

  // Thread 列表状态
  const [threads, setThreads] = useState<Map<string, Thread>>(new Map());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // 当前 thread 的消息
  const [threadMessages, setThreadMessages] = useState<Map<string, ThreadMessageLike[]>>(
    new Map(),
  );

  // 运行状态
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  // 使用 ref 避免重复初始化
  const isInitializedRef = useRef(false);

  // 加载 thread 列表
  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const threadList = await threadApi.listThreads(teamId, userId, agentId);
      console.log('[loadThreads] Fetched threads from server:', threadList.length);

      // 用于存储合并后的 threadMap，供后续使用
      let mergedThreadMap: Map<string, Thread>;

      // 关键修复：合并服务器返回的 threads 和本地已有的 threads
      // 这样可以保留本地刚创建但可能还没同步到服务器的 thread
      setThreads((prevThreads) => {
        const threadMap = new Map(threadList.map((t) => [t.id, t]));

        // 保留本地的 threads（如果不在服务器返回的列表中）
        prevThreads.forEach((thread, id) => {
          if (!threadMap.has(id)) {
            console.log('[loadThreads] Preserving local thread:', id);
            threadMap.set(id, thread);
          }
        });

        console.log('[loadThreads] Merged threads:', threadMap.size, 'threads');
        mergedThreadMap = threadMap;  // 保存引用供后续使用
        return threadMap;
      });

      // 使用函数式更新，确保 currentThreadId 在合并后的 threads 中
      setCurrentThreadId((prevId) => {
        // 如果已经有选中的 thread，检查它是否在合并后的 map 中
        if (prevId && mergedThreadMap.has(prevId)) {
          console.log('[loadThreads] Keeping current thread:', prevId);
          return prevId;
        }

        // 如果之前的 thread 不存在了，或者没有选中，选择第一个
        const newThreadId = threadList.length > 0 ? threadList[0].id : null;
        console.log('[loadThreads] Switching to thread:', newThreadId);
        return newThreadId;
      });
    } catch (error) {
      console.error('[loadThreads] Failed to load threads:', error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [teamId, userId, agentId]);

  // 加载当前 thread 的消息
  const loadThreadMessages = useCallback(
    async (threadId: string) => {
      try {
        const messages = await threadApi.getMessages(threadId, teamId);
        const convertedMessages = messages.map(convertMessageToThreadMessage);
        setThreadMessages((prev) => new Map(prev).set(threadId, convertedMessages));
      } catch (error) {
        console.error('Failed to load messages:', error);
        setThreadMessages((prev) => new Map(prev).set(threadId, []));
      }
    },
    [teamId],
  );

  // 初始化加载（避免重复加载）
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      loadThreads();
    }
  }, []);

  // 加载当前 thread 的消息
  useEffect(() => {
    if (currentThreadId) {
      loadThreadMessages(currentThreadId);
    }
  }, [currentThreadId, loadThreadMessages]);

  // 如果没有 threads,自动创建第一个
  useEffect(() => {
    if (!isLoadingThreads && threads.size === 0 && !currentThreadId) {
      const createInitialThread = async () => {
        try {
          console.log('[createInitialThread] Creating initial thread...');
          const newThread = await threadApi.createThread(teamId, userId, {
            agentId,
            title: 'New Chat',
          });
          console.log('[createInitialThread] Initial thread created:', newThread.id);

          // 修复：使用函数式更新，添加而不是替换
          setThreads((prev) => {
            const next = new Map(prev);
            next.set(newThread.id, newThread);
            console.log('[createInitialThread] Updated threads:', Array.from(next.keys()));
            return next;
          });
          setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
          setCurrentThreadId(newThread.id);
        } catch (error) {
          console.error('[createInitialThread] Failed to create initial thread:', error);
        }
      };

      createInitialThread();
    }
  }, [isLoadingThreads, threads.size, currentThreadId, teamId, userId, agentId]);

  // 获取当前 thread 的消息
  const currentMessages = useMemo(() => {
    if (!currentThreadId) {
      console.log('[useThreadListRuntime] No currentThreadId, returning empty messages');
      return [];
    }
    const messages = threadMessages.get(currentThreadId) || [];
    console.log('[useThreadListRuntime] Current messages for thread', currentThreadId, ':', messages.length);
    return messages;
  }, [currentThreadId, threadMessages]);

  // 发送新消息
  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!currentThreadId) return;
      if (message.content.length !== 1 || message.content[0]?.type !== 'text') {
        throw new Error('Only text content is supported');
      }

      // 自动改名：仅在“首条用户消息”且标题为空/默认时触发
      const existingMessages = threadMessages.get(currentThreadId) || [];
      const activeThread = threads.get(currentThreadId);
      if (
        existingMessages.length === 0 &&
        activeThread &&
        (!activeThread.title || activeThread.title === 'New Chat')
      ) {
        const newTitle = deriveThreadTitleFromText(message.content[0].text);
        if (newTitle) {
          // 乐观更新本地
          setThreads((prev) => {
            const t = prev.get(currentThreadId);
            if (!t) return prev;
            return new Map(prev).set(currentThreadId, { ...t, title: newTitle });
          });
          // 异步写回服务端
          void threadApi
            .updateThread(currentThreadId, teamId, { title: newTitle })
            .catch((e) => console.warn('[useThreadListRuntime] Auto-rename failed:', e));
        }
      }

      const userMessage: ThreadMessageLike = {
        role: 'user',
        content: message.content,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      // 添加用户消息到状态
      setThreadMessages((prev) => {
        const current = prev.get(currentThreadId) || [];
        return new Map(prev).set(currentThreadId, [...current, userMessage]);
      });

      // 开始流式响应
      setIsRunning(true);

      try {
        const assistantId = `assistant-${Date.now()}`;
        let assistantText = '';

        // 创建初始 assistant 消息
        const assistantMessage: ThreadMessageLike = {
          role: 'assistant',
          content: [{ type: 'text', text: '' }],
          id: assistantId,
          createdAt: new Date(),
        };

        setThreadMessages((prev) => {
          const current = prev.get(currentThreadId) || [];
          return new Map(prev).set(currentThreadId, [...current, assistantMessage]);
        });

        // 流式接收响应
        const stream = chatApi.streamChat(currentThreadId, teamId, userId, {
          message: message.content[0].text,
          agentId,
        });

        for await (const event of stream) {
          if (event.type === 'content_delta') {
            assistantText += event.delta;

            // 更新 assistant 消息
            setThreadMessages((prev) => {
              const current = prev.get(currentThreadId) || [];
              return new Map(prev).set(
                currentThreadId,
                current.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: [{ type: 'text', text: assistantText }],
                      }
                    : m,
                ),
              );
            });
          } else if (event.type === 'tool_call') {
            // 处理工具调用
            const toolCall = {
              type: 'tool-call' as const,
              toolCallId: event.tool_call.id,
              toolName: event.tool_call.name,
              args: event.tool_call.arguments,
            };

            setThreadMessages((prev) => {
              const current = prev.get(currentThreadId) || [];
              return new Map(prev).set(
                currentThreadId,
                current.map((m) => {
                  if (m.id === assistantId) {
                    const textContent = m.content.filter((c) => c.type === 'text');
                    return {
                      ...m,
                      content: [...textContent, toolCall],
                    };
                  }
                  return m;
                }),
              );
            });
          } else if (event.type === 'tool_result') {
            // 处理工具结果
            setThreadMessages((prev) => {
              const current = prev.get(currentThreadId) || [];
              return new Map(prev).set(
                currentThreadId,
                current.map((m) => {
                  if (m.id === assistantId) {
                    return {
                      ...m,
                      content: m.content.map((part) => {
                        if (
                          part.type === 'tool-call' &&
                          part.toolCallId === event.tool_call_id
                        ) {
                          return {
                            ...part,
                            result: event.result,
                          };
                        }
                        return part;
                      }),
                    };
                  }
                  return m;
                }),
              );
            });
          } else if (event.type === 'done') {
            // 完成
            break;
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        throw error;
      } finally {
        setIsRunning(false);
      }
    },
    [currentThreadId, teamId, userId, agentId],
  );

  // ThreadList Adapter
  const threadListAdapter: ExternalStoreThreadListAdapter = useMemo(
    () => {
      // 在加载期间，强制 threadId 为 undefined，避免竞态条件
      const validThreadId = isLoadingThreads
        ? undefined
        : (currentThreadId && threads.has(currentThreadId) ? currentThreadId : undefined);

      // 调试日志
      console.log('[ThreadListAdapter] Creating adapter:', {
        isLoadingThreads,
        currentThreadId,
        validThreadId,
        threadsSize: threads.size,
        threadIds: Array.from(threads.keys()).slice(0, 5),  // 只显示前5个
        hasCurrentThread: threads.has(currentThreadId || ''),
      });

      const threadDataArray = Array.from(threads.values()).map(convertThreadToThreadData);
      console.log('[ThreadListAdapter] Thread data array length:', threadDataArray.length);

      return {
        threadId: validThreadId,
        threads: threadDataArray,
        archivedThreads: [], // 暂不支持归档

        onSwitchToNewThread: async () => {
          console.log('[ThreadListAdapter] onSwitchToNewThread called');
          try {
            const newThread = await threadApi.createThread(teamId, userId, {
              agentId,
              title: 'New Chat',
            });
            console.log('[ThreadListAdapter] New thread created:', newThread);

            setThreads((prev) => {
              const next = new Map(prev).set(newThread.id, newThread);
              console.log('[ThreadListAdapter] Updated threads after create:', Array.from(next.keys()));
              return next;
            });
            setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
            setCurrentThreadId(newThread.id);
          } catch (error) {
            console.error('[ThreadListAdapter] Failed to create thread:', error);
          }
        },

        onSwitchToThread: async (threadId: string) => {
          console.log('[ThreadListAdapter] onSwitchToThread called:', threadId);
          setCurrentThreadId(threadId);
        },

      onRename: async (threadId: string, newTitle: string) => {
        try {
          await threadApi.updateThread(threadId, teamId, { title: newTitle });
          setThreads((prev) => {
            const thread = prev.get(threadId);
            if (thread) {
              return new Map(prev).set(threadId, { ...thread, title: newTitle });
            }
            return prev;
          });
        } catch (error) {
          console.error('Failed to rename thread:', error);
        }
      },

      onArchive: async (threadId: string) => {
        // TODO: 实现归档功能
        console.log('Archive thread:', threadId);
      },

      onUnarchive: async (threadId: string) => {
        // TODO: 实现取消归档功能
        console.log('Unarchive thread:', threadId);
      },

      onDelete: async (threadId: string) => {
        console.log('[ThreadListAdapter] onDelete called:', threadId);
        try {
          await threadApi.deleteThread(threadId, teamId);
          console.log('[ThreadListAdapter] Thread deleted from server');

          setThreads((prev) => {
            const next = new Map(prev);
            next.delete(threadId);
            console.log('[ThreadListAdapter] Updated threads after delete:', Array.from(next.keys()));
            return next;
          });

          setThreadMessages((prev) => {
            const next = new Map(prev);
            next.delete(threadId);
            return next;
          });

          // 使用函数式更新来获取最新的 currentThreadId
          setCurrentThreadId((prevThreadId) => {
            console.log('[ThreadListAdapter] Updating currentThreadId, prev:', prevThreadId);
            if (prevThreadId === threadId) {
              // 从当前的 threads state 中获取剩余的 threads（删除前的状态）
              const updatedThreads = Array.from(threads.values()).filter(
                (t) => t.id !== threadId,
              );
              const newThreadId = updatedThreads.length > 0 ? updatedThreads[0].id : null;
              console.log('[ThreadListAdapter] Switching to new thread:', newThreadId);
              return newThreadId;
            }
            return prevThreadId;
          });
        } catch (error) {
          console.error('[ThreadListAdapter] Failed to delete thread:', error);
        }
      },
      };
    },
    [currentThreadId, threads, teamId, userId, agentId, isLoadingThreads],  // 添加 isLoadingThreads 依赖
  );

  // 创建 runtime
  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    isRunning,
    onNew,
    setMessages: (messages) => {
      console.log('[useThreadListRuntime] setMessages called, currentThreadId:', currentThreadId, 'messages:', messages.length);
      if (currentThreadId) {
        setThreadMessages((prev) => new Map(prev).set(currentThreadId, messages));
      }
    },
    // 重要：提供 convertMessage 函数,确保消息格式正确
    convertMessage: (message) => message,
    // 临时移除 threadList adapter 来排查问题
    // adapters: {
    //   threadList: threadListAdapter,
    // },
  });

  console.log('[useThreadListRuntime] Returning runtime, currentThreadId:', currentThreadId, 'threads:', threads.size);

  return {
    runtime,
    isLoadingThreads,
    currentThreadId,
    threads: Array.from(threads.values()),
    // 暴露操作方法供自定义 UI 使用
    switchToThread: async (threadId: string) => {
      console.log('[useThreadListRuntime] Switching to thread:', threadId);
      setCurrentThreadId(threadId);
    },
    createNewThread: async () => {
      console.log('[useThreadListRuntime] Creating new thread');
      try {
        const newThread = await threadApi.createThread(teamId, userId, {
          agentId,
          title: 'New Chat',
        });
        setThreads((prev) => new Map(prev).set(newThread.id, newThread));
        setThreadMessages((prev) => new Map(prev).set(newThread.id, []));
        setCurrentThreadId(newThread.id);
        return newThread;
      } catch (error) {
        console.error('[useThreadListRuntime] Failed to create thread:', error);
        throw error;
      }
    },
    deleteThread: async (threadId: string) => {
      console.log('[useThreadListRuntime] Deleting thread:', threadId);
      try {
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

        // 如果删除的是当前 thread，切换到另一个
        setCurrentThreadId((prevId) => {
          if (prevId === threadId) {
            const remainingThreads = Array.from(threads.values()).filter(
              (t) => t.id !== threadId,
            );
            return remainingThreads.length > 0 ? remainingThreads[0].id : null;
          }
          return prevId;
        });
      } catch (error) {
        console.error('[useThreadListRuntime] Failed to delete thread:', error);
        throw error;
      }
    },
  };
}
