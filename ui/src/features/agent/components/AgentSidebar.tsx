/**
 * AgentSidebar - Agent 侧边栏组件
 * 用于 tldraw 等其他页面集成 Agent 聊天功能
 */

import { useState, useEffect, useRef } from 'react';
import { X, GripVertical, List } from 'lucide-react';
import { cn } from '@/utils';
import { AgentRuntimeProvider } from './AgentRuntimeProvider';
import { MiniThreadList } from './MiniThreadList';
import { Thread } from '@/components/assistant-ui/thread';
import type { AgentMode, AgentModeConfig } from '../types/agent.types';
import { useAgentEvent, updateAgentState } from '../events/agent-events';

interface AgentSidebarProps {
  /** Agent ID */
  agentId: string;
  /** Team ID */
  teamId: string;
  /** User ID */
  userId: string;
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 位置 */
  position?: 'left' | 'right';
  /** 初始宽度 */
  defaultWidth?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 是否显示线程列表 */
  showThreadList?: boolean;
  /** 模式 */
  mode?: AgentMode;
  /** 模式配置 */
  modeConfig?: Partial<AgentModeConfig>;
}

export function AgentSidebar({
  agentId,
  teamId,
  userId,
  visible,
  onClose,
  position = 'right',
  defaultWidth = 600,
  minWidth = 400,
  maxWidth = 1000,
  resizable = true,
  showThreadList = true,
  mode = 'mini',
  modeConfig,
}: AgentSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [view, setView] = useState<'thread' | 'list'>('thread'); // mini模式下的视图状态
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 监听线程切换事件
  useAgentEvent('agent:thread-switched', (detail) => {
    if (detail.agentId === agentId) {
      setCurrentThreadId(detail.threadId);
      // 切换到聊天视图
      if (mode === 'mini') {
        setView('thread');
      }
    }
  }, [agentId, mode]);

  // 同步状态到事件系统
  useEffect(() => {
    if (visible) {
      updateAgentState({
        agentId,
        threadId: currentThreadId,
        isOpen: true,
      });
    } else {
      updateAgentState({
        agentId: null,
        threadId: null,
        isOpen: false,
      });
    }
  }, [visible, agentId, currentThreadId]);

  // 处理拖动调整大小
  useEffect(() => {
    if (!resizable) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = position === 'right'
        ? window.innerWidth - e.clientX
        : e.clientX;

      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, position, minWidth, maxWidth, resizable]);

  if (!visible) return null;

  const finalModeConfig: Partial<AgentModeConfig> = {
    ...modeConfig,
    showThreadList,
    position,
    width: mode === 'mini' ? undefined : 240, // mini模式下不需要threadlist的宽度
  };

  // mini 模式使用单面板切换
  const isMiniMode = mode === 'mini';

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'fixed top-0 z-50 flex h-screen border-l bg-background shadow-lg transition-transform duration-300',
        position === 'right' ? 'right-0' : 'left-0',
        visible ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'
      )}
      style={{ width: `${width}px` }}
    >
      {/* 调整大小手柄 */}
      {resizable && (
        <div
          className={cn(
            'absolute top-0 z-10 flex h-full w-1 cursor-col-resize items-center bg-transparent transition-colors hover:bg-primary/20',
            position === 'right' ? 'left-0' : 'right-0'
          )}
          onMouseDown={() => setIsResizing(true)}
        >
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full bg-border p-1',
            position === 'right' ? '-left-2' : '-right-2'
          )}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Agent Runtime Provider */}
      <AgentRuntimeProvider
        agentId={agentId}
        teamId={teamId}
        userId={userId}
        mode={mode}
        modeConfig={finalModeConfig}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              {/* mini模式下显示切换按钮 */}
              {isMiniMode && showThreadList && (
                <button
                  className={cn(
                    'rounded p-1.5 transition-colors hover:bg-accent',
                    view === 'list' && 'bg-accent'
                  )}
                  onClick={() => setView(view === 'thread' ? 'list' : 'thread')}
                  title={view === 'thread' ? 'Show thread list' : 'Show chat'}
                >
                  <List className="h-5 w-5" />
                </button>
              )}
              <h2 className="font-semibold text-base">
                {isMiniMode && view === 'list' ? 'Chats' : 'Agent Chat'}
              </h2>
            </div>
            {onClose && (
              <button
                className="rounded p-1.5 hover:bg-accent"
                onClick={onClose}
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          {isMiniMode ? (
            // mini模式：单面板切换
            <div className="flex-1 overflow-hidden">
              {view === 'list' && showThreadList ? (
                <MiniThreadList
                  showHeader={false}
                  showClose={false}
                  className="h-full w-full border-r-0"
                />
              ) : (
                <Thread />
              )}
            </div>
          ) : (
            // 非mini模式：左右分栏
            <div className="flex h-full overflow-hidden">
              {/* ThreadList */}
              {showThreadList && (
                <MiniThreadList showHeader={true} showClose={false} />
              )}

              {/* Thread Chat Area */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <Thread />
              </div>
            </div>
          )}
        </div>
      </AgentRuntimeProvider>
    </div>
  );
}

/**
 * 使用示例:
 *
 * ```tsx
 * function MyPage() {
 *   const [showAgent, setShowAgent] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowAgent(true)}>
 *         Open Agent
 *       </button>
 *
 *       <AgentSidebar
 *         agentId="agent-id"
 *         teamId="team-id"
 *         userId="user-id"
 *         visible={showAgent}
 *         onClose={() => setShowAgent(false)}
 *         position="right"
 *         showThreadList={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
