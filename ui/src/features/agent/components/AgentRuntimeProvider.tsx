/**
 * AgentRuntimeProvider - 使用 ThreadListRuntime 的 Provider 组件
 */

import { type ReactNode, createContext, useContext } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useThreadListRuntime } from '../hooks/useThreadListRuntime';
import type { Thread } from '../types/agent.types';

interface AgentRuntimeProviderProps {
  children: ReactNode;
  teamId: string;
  userId: string;
  agentId?: string;
}

// 创建 Context 用于共享 thread 列表数据
interface ThreadListContextValue {
  threads: Thread[];
  currentThreadId: string | null;
  isLoadingThreads: boolean;
  switchToThread: (threadId: string) => Promise<void>;
  createNewThread: () => Promise<Thread>;
  deleteThread: (threadId: string) => Promise<void>;
}

const ThreadListContext = createContext<ThreadListContextValue | null>(null);

/**
 * Hook to access thread list context
 */
export function useThreadListContext() {
  const context = useContext(ThreadListContext);
  if (!context) {
    throw new Error('useThreadListContext must be used within AgentRuntimeProvider');
  }
  return context;
}

/**
 * Provider 组件,提供完整的 ThreadList Runtime
 * 包含必要的 TooltipProvider
 */
export function AgentRuntimeProvider({
  children,
  teamId,
  userId,
  agentId,
}: AgentRuntimeProviderProps) {
  const {
    runtime,
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
  } = useThreadListRuntime({
    teamId,
    userId,
    agentId,
  });

  const threadListContextValue: ThreadListContextValue = {
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
  };

  return (
    <ThreadListContext.Provider value={threadListContextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        <TooltipProvider>{children}</TooltipProvider>
      </AssistantRuntimeProvider>
    </ThreadListContext.Provider>
  );
}
