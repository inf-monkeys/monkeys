import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';
import { IParsedTodoItem } from '@/utils/agent-v2-response-parser';

interface IAgentV2TodoListProps {
  todoItems: IParsedTodoItem[];
  className?: string;
}

const getStatusIcon = (status: IParsedTodoItem['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="size-4 text-yellow-600" />;
    case 'pending':
    default:
      return <Circle className="size-4 text-gray-400" />;
  }
};

const getStatusColor = (status: IParsedTodoItem['status']) => {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'in_progress':
      return 'text-yellow-600';
    case 'pending':
    default:
      return 'text-gray-600';
  }
};

const getStatusText = (status: IParsedTodoItem['status']) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'in_progress':
      return '进行中';
    case 'pending':
    default:
      return '待处理';
  }
};

const getPriorityIcon = (priority?: IParsedTodoItem['priority']) => {
  switch (priority) {
    case 'high':
      return <AlertTriangle className="size-3 text-red-500" />;
    case 'medium':
      return <AlertTriangle className="size-3 text-yellow-500" />;
    case 'low':
      return <AlertTriangle className="size-3 text-green-500" />;
    default:
      return null;
  }
};

const getPriorityText = (priority?: IParsedTodoItem['priority']) => {
  switch (priority) {
    case 'high':
      return '高优先级';
    case 'medium':
      return '中优先级';
    case 'low':
      return '低优先级';
    default:
      return null;
  }
};

const TodoItem: React.FC<{ item: IParsedTodoItem; index: number }> = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        item.status === 'completed' && 'border-green-200 bg-green-50',
        item.status === 'in_progress' && 'border-yellow-200 bg-yellow-50',
        item.status === 'pending' && 'border-gray-200 bg-gray-50',
      )}
    >
      <div className="mt-0.5">{getStatusIcon(item.status)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-relaxed',
              item.status === 'completed' && 'text-gray-500 line-through',
              getStatusColor(item.status),
            )}
          >
            {item.content}
          </p>

          <div className="flex shrink-0 items-center gap-1">
            {item.priority && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  item.priority === 'high' && 'border-red-200 bg-red-50 text-red-700',
                  item.priority === 'medium' && 'border-yellow-200 bg-yellow-50 text-yellow-700',
                  item.priority === 'low' && 'border-green-200 bg-green-50 text-green-700',
                )}
              >
                <div className="flex items-center gap-1">
                  {getPriorityIcon(item.priority)}
                  {getPriorityText(item.priority)}
                </div>
              </Badge>
            )}

            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                item.status === 'completed' && 'bg-green-100 text-green-700',
                item.status === 'in_progress' && 'bg-yellow-100 text-yellow-700',
                item.status === 'pending' && 'bg-gray-100 text-gray-700',
              )}
            >
              {getStatusText(item.status)}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AgentV2TodoList: React.FC<IAgentV2TodoListProps> = ({ todoItems, className }) => {
  if (todoItems.length === 0) {
    return null;
  }

  // 统计各状态的数量
  const stats = todoItems.reduce(
    (acc, item) => {
      acc[item.status]++;
      return acc;
    },
    { pending: 0, in_progress: 0, completed: 0 },
  );

  return (
    <Card
      className={cn(
        'w-full',
        className?.includes('compact-mode') && 'border-blue-100 bg-blue-50/50 shadow-none',
        className,
      )}
    >
      <CardHeader className={cn('pb-3', className?.includes('compact-mode') && 'pb-2 pt-3')}>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">📝 任务清单</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Circle className="size-3" />
              待处理 {stats.pending}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              进行中 {stats.in_progress}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              已完成 {stats.completed}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <AnimatePresence>
          {todoItems.map((item, index) => (
            <TodoItem key={item.id} item={item} index={index} />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
