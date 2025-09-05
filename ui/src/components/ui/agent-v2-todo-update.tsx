import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, ChevronDown, ChevronUp, Clock, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';
import { parseTodoUpdateContent } from '@/utils/todo-update-parser';

interface IAgentV2TodoUpdateProps {
  todosText: string;
  className?: string;
}

export const AgentV2TodoUpdate: React.FC<IAgentV2TodoUpdateProps> = ({ todosText, className }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const todoItems = parseTodoUpdateContent(todosText);

  // 统计完成状态
  const completedCount = todoItems.filter((item) => item.completed).length;
  const totalCount = todoItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPreview = () => {
    if (todoItems.length === 0) return '暂无任务';
    const firstFew = todoItems
      .slice(0, 2)
      .map((item) => item.content)
      .join('、');
    return totalCount > 2 ? `${firstFew} 等${totalCount}个任务` : firstFew;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
    >
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-sm">
        <CardHeader
          className={cn('cursor-pointer pb-3 transition-colors hover:bg-blue-100/50', !isExpanded && 'pb-4')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-base text-blue-900">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckSquare className="size-4 text-blue-600" />
                <Clock className="size-3 text-amber-500" />
              </div>
              任务规划
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <span>
                  ({completedCount}/{totalCount})
                </span>
                {progress > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-blue-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span>{progress}%</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="xs" className="h-6 w-6 p-0 text-blue-700 hover:bg-blue-200">
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CardTitle>

          {!isExpanded && <CardDescription className="mt-1 text-blue-700">{getPreview()}</CardDescription>}
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-2">
                {todoItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-blue-600">暂无任务项目</p>
                ) : (
                  todoItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                        item.completed
                          ? 'border-blue-300 bg-blue-100/50 text-blue-800'
                          : 'border-blue-200 bg-white text-blue-900',
                      )}
                    >
                      <div className="flex-shrink-0">
                        {item.completed ? (
                          <CheckSquare className="size-4 text-blue-600" />
                        ) : (
                          <Square className="size-4 text-blue-400" />
                        )}
                      </div>
                      <span
                        className={cn('flex-1 text-sm leading-relaxed', item.completed && 'line-through opacity-75')}
                      >
                        {item.content}
                      </span>
                      {item.completed && <div className="flex-shrink-0 text-xs font-medium text-blue-600">✓ 完成</div>}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
