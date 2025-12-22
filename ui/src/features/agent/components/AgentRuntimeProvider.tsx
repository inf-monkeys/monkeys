/**
 * AgentRuntimeProvider - 使用 ThreadListRuntime 的 Provider 组件
 */

import { type ReactNode, createContext, useContext } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { TooltipProvider } from '@/components/ui/tooltip';
// import { useThreadListRuntime } from '../hooks/useThreadListRuntime';
import { useThreadListWithTools } from '../hooks/useThreadListWithTools';
import type { AgentMode, AgentModeConfig, Thread } from '../types/agent.types';
import { AgentModeProvider } from '../contexts/AgentModeContext';
import { AgentContextProvider } from '../contexts/AgentContextProvider';
import {
  ApprovalToolUI,
  WebSearchToolUI,
  CalculatorToolUI,
} from './ToolUIs';
import {
  TldrawGetCanvasStateToolUI,
  TldrawCreateShapeToolUI,
  TldrawUpdateShapeToolUI,
  TldrawDeleteShapesToolUI,
  TldrawSelectShapesToolUI,
  TldrawCreateWorkflowToolUI,
} from './TldrawToolUIs';

interface AgentRuntimeProviderProps {
  children: ReactNode;
  teamId: string;
  userId: string;
  agentId?: string;
  /** 初始 threadId（可选），如果提供则优先使用这个 thread */
  initialThreadId?: string | null;
  /** Agent 显示模式 */
  mode?: AgentMode;
  /** 模式配置 */
  modeConfig?: Partial<AgentModeConfig>;
  // Canvas context provider (optional, for tldraw integration)
  getCanvasData?: () => any;
  getSelectedShapeIds?: () => string[];
  getViewport?: () => { x: number; y: number; zoom: number };
  // Design board ID provider (optional, for canvas persistence)
  getDesignBoardId?: () => string | undefined;
}

// 创建 Context 用于共享 thread 列表数据
interface ThreadListContextValue {
  threads: Thread[];
  currentThreadId: string | null;
  isLoadingThreads: boolean;
  switchToThread: (threadId: string) => Promise<void>;
  createNewThread: () => Promise<Thread>;
  deleteThread: (threadId: string) => Promise<void>;
  reloadThreads: () => Promise<void>;
  reloadMessages: () => Promise<void>;
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
 * 包含必要的 TooltipProvider 和 AgentModeProvider
 */
export function AgentRuntimeProvider({
  children,
  teamId,
  userId,
  agentId,
  initialThreadId,
  mode = 'normal',
  modeConfig,
  getCanvasData,
  getSelectedShapeIds,
  getViewport,
  getDesignBoardId,
}: AgentRuntimeProviderProps) {
  const {
    runtime,
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
    reloadThreads,
    reloadMessages,
  } = useThreadListWithTools({
    teamId,
    userId,
    agentId,
    initialThreadId,
    getCanvasData,
    getSelectedShapeIds,
    getViewport,
    getDesignBoardId,
  });

  const threadListContextValue: ThreadListContextValue = {
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
    reloadThreads,
    reloadMessages,
  };

  return (
    <AgentModeProvider mode={mode} modeConfig={modeConfig}>
      <AgentContextProvider teamId={teamId} userId={userId} agentId={agentId}>
        <ThreadListContext.Provider value={threadListContextValue}>
          <AssistantRuntimeProvider runtime={runtime}>
            <TooltipProvider>
              {/* Register Tool UI Components */}
              <ApprovalToolUI />
              <WebSearchToolUI />
              <CalculatorToolUI />

              {/* Tldraw Tool UI Components */}
              <TldrawGetCanvasStateToolUI />
              <TldrawCreateShapeToolUI />
              <TldrawUpdateShapeToolUI />
              <TldrawDeleteShapesToolUI />
              <TldrawSelectShapesToolUI />
              <TldrawCreateWorkflowToolUI />

              {/* Child components */}
              {children}
            </TooltipProvider>
          </AssistantRuntimeProvider>
        </ThreadListContext.Provider>
      </AgentContextProvider>
    </AgentModeProvider>
  );
}
