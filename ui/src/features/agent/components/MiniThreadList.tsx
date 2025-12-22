/**
 * MiniThreadList - 紧凑版 Thread 列表组件
 * 用于 mini 和 embed 模式的侧边栏
 */

import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { useThreadListContext } from './AgentRuntimeProvider';
import { useAgentMode } from '../contexts/AgentModeContext';
import type { Thread } from '../types/agent.types';
import { cn } from '@/utils';

interface MiniThreadListProps {
  className?: string;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
}

export function MiniThreadList({
  className,
  showHeader = true,
  showClose,
  onClose
}: MiniThreadListProps) {
  const {
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
  } = useThreadListContext();

  const { isMiniMode, isEmbedMode, width = 240 } = useAgentMode();

  const containerWidth = typeof width === 'number' ? `${width}px` : width;

  if (isLoadingThreads && threads.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center border-r bg-background p-2', className)}
        style={{ width: containerWidth }}
      >
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-shrink-0 flex-col border-r bg-background', className)}
      style={{ width: containerWidth }}
    >
      {/* Header - 可选 */}
      {showHeader && (
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Chats</span>
          </div>
          {showClose && onClose && (
            <button
              className="rounded p-1 hover:bg-accent"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* New Chat Button */}
      <div className="border-b p-2">
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={createNewThread}
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">No chats yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {threads.map((thread) => (
              <MiniThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === currentThreadId}
                onSelect={() => switchToThread(thread.id)}
                onDelete={() => deleteThread(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MiniThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function MiniThreadItem({ thread, isActive, onSelect, onDelete }: MiniThreadItemProps) {
  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
        'hover:bg-accent',
        isActive && 'bg-accent/70 font-medium',
      )}
      onClick={onSelect}
      title={thread.title || 'New Chat'}
    >
      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-xs">
        {thread.title || 'New Chat'}
      </span>
      <button
        className={cn(
          'rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10',
          'group-hover:opacity-100',
          isActive && 'opacity-100',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}
