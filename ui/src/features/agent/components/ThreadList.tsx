/**
 * ThreadList 组件 - Thread 列表
 */

import { useThreadList } from '../hooks/useThread';
import type { Thread } from '../types/agent.types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface ThreadListProps {
  teamId: string;
  userId?: string;
  onThreadSelect: (threadId: string) => void;
  selectedThreadId?: string;
  className?: string;
}

/**
 * Thread 列表组件 - 使用 shadcn 样式
 */
export function ThreadList({
  teamId,
  userId,
  onThreadSelect,
  selectedThreadId,
  className = '',
}: ThreadListProps) {
  const { data: threads = [], loading, error, refresh } = useThreadList(teamId, userId);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${className}`}>
        <div className="rounded-full bg-destructive/10 p-3">
          <MessageSquare className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium">Failed to load conversations</p>
          <p className="text-xs text-muted-foreground">Please try again</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
        >
          Retry
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 text-center ${className}`}>
        <div className="rounded-full bg-muted p-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="text-xs text-muted-foreground">
            Start a new conversation to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {threads.map((thread) => (
        <ThreadListItem
          key={thread.id}
          thread={thread}
          isSelected={thread.id === selectedThreadId}
          onClick={() => onThreadSelect(thread.id)}
        />
      ))}
    </div>
  );
}

/**
 * Thread 列表项 - shadcn 样式
 */
function ThreadListItem({
  thread,
  isSelected,
  onClick,
}: {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}) {
  const timeAgo = thread.lastMessageAt
    ? formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })
    : formatDistanceToNow(new Date(thread.createdTimestamp), { addSuffix: true });

  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm
        ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border bg-card hover:bg-accent/50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {/* Title */}
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {thread.title || 'Untitled conversation'}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
            {thread.state?.isRunning && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running
                </Badge>
              </>
            )}
          </div>

          {/* Tags */}
          {thread.metadata?.tags && thread.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {thread.metadata.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="h-5 px-1.5 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Task Progress */}
          {thread.state?.taskProgress && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {thread.state.taskProgress.status}
                </span>
                <span className="font-mono text-muted-foreground">
                  {thread.state.taskProgress.current}/{thread.state.taskProgress.total}
                </span>
              </div>
              <Progress
                value={
                  (thread.state.taskProgress.current /
                    thread.state.taskProgress.total) *
                  100
                }
                className="h-1.5"
              />
            </div>
          )}
        </div>

        {/* Running indicator */}
        {thread.state?.isRunning && (
          <div className="flex-shrink-0 pt-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          </div>
        )}
      </div>
    </button>
  );
}
