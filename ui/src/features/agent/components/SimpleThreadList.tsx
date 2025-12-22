/**
 * SimpleThreadList - 简单的 Thread 列表组件
 * 不依赖 assistant-ui 的 ThreadList，避免 store 同步问题
 */

import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useThreadListContext } from './AgentRuntimeProvider';
import type { Thread } from '../types/agent.types';

interface SimpleThreadListProps {
  className?: string;
}

export function SimpleThreadList({
  className = '',
}: SimpleThreadListProps) {
  const {
    threads,
    currentThreadId,
    isLoadingThreads,
    switchToThread,
    createNewThread,
    deleteThread,
  } = useThreadListContext();

  if (isLoadingThreads && threads.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-sm text-muted-foreground">Loading threads...</div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">No conversations yet</p>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          onClick={createNewThread}
        >
          <Plus className="inline h-4 w-4 mr-1" />
          New Chat
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* New Chat Button */}
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm mb-2"
        onClick={createNewThread}
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>

      {/* Thread List */}
      {threads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isActive={thread.id === currentThreadId}
          onSelect={() => switchToThread(thread.id)}
          onDelete={() => deleteThread(thread.id)}
        />
      ))}
    </div>
  );
}

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ThreadItem({ thread, isActive, onSelect, onDelete }: ThreadItemProps) {
  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
        hover:bg-accent transition-colors
        ${isActive ? 'bg-accent' : ''}
      `}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm truncate">
        {thread.title || 'New Chat'}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}
