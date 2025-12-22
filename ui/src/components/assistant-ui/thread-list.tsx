/**
 * ThreadList - 使用 assistant-ui 原生组件
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { ThreadListItemPrimitive, ThreadListPrimitive } from '@assistant-ui/react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { FC } from 'react';

interface ThreadListProps {
  className?: string;
}

/**
 * ThreadList 组件 - 使用 assistant-ui primitives
 */
export function ThreadList({ className }: ThreadListProps) {
  return (
    <ThreadListPrimitive.Root className={cn('flex h-full flex-col gap-2', className)}>
      {/* New Thread Button */}
      <ThreadListPrimitive.New asChild>
        <Button variant="outline" className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </ThreadListPrimitive.New>

      {/* Thread Items */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-36">
        <ThreadListPrimitive.Items
          components={{
            ThreadListItem: ThreadListItem,
          }}
        />
      </div>
    </ThreadListPrimitive.Root>
  );
}

/**
 * ThreadListItem - 单个线程项
 */
const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root
      className={cn(
        'group relative mb-2 flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-all',
        'hover:bg-accent/50 hover:shadow-sm',
        'data-[active=true]:border-primary data-[active=true]:bg-primary/5 data-[active=true]:shadow-sm',
      )}
    >
      <ThreadListItemPrimitive.Trigger className="flex flex-1 items-center gap-3 overflow-hidden">
        <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ThreadListItemPrimitive.Title className="truncate text-sm font-medium" />
          {/* 可选：显示最后消息时间 */}
        </div>
      </ThreadListItemPrimitive.Trigger>

      {/* Delete Button */}
      <ThreadListItemPrimitive.Delete
        className={cn(
          'flex-shrink-0 rounded p-1.5 opacity-0 transition-opacity',
          'hover:bg-destructive/10 hover:text-destructive',
          'group-hover:opacity-100',
        )}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-4 w-4" />
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
};
