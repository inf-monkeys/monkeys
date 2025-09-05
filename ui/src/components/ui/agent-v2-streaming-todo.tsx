import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, ChevronDown, ChevronUp, Clock, Minus, Square, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ILiveTodoState } from '@/hooks/use-live-todo-tracker';
import { cn } from '@/utils';
import { ITodoUpdateItem, TodoStatus } from '@/utils/todo-update-parser';

interface IAgentV2StreamingTodoProps {
  todoState: ILiveTodoState;
  className?: string;
}

// 创建动态更新序列
const createUpdateSequence = (currentTodos: ITodoUpdateItem[], updateHistory: ILiveTodoState['updateHistory']) => {
  if (updateHistory.length <= 1) {
    return [currentTodos];
  }

  // 返回历史更新序列
  return updateHistory.map((history) => history.todos);
};

// 根据状态获取图标
const getStatusIcon = (status: TodoStatus, completed: boolean) => {
  switch (status) {
    case 'completed':
      return <CheckSquare className="size-4 text-green-600" />;
    case 'in_progress':
      return <Minus className="size-4 text-yellow-600" />;
    case 'pending':
    default:
      return <Square className="size-4 text-gray-400" />;
  }
};

// 根据状态获取样式类名
const getStatusStyles = (status: TodoStatus, completed: boolean) => {
  switch (status) {
    case 'completed':
      return {
        container: 'border-green-300 bg-green-100/50 text-green-800',
        text: 'text-green-800 line-through opacity-75',
      };
    case 'in_progress':
      return {
        container: 'border-yellow-300 bg-yellow-100/50 text-yellow-800',
        text: 'text-yellow-800 font-medium',
      };
    case 'pending':
    default:
      return {
        container: 'border-gray-200 bg-white text-gray-900',
        text: 'text-gray-900',
      };
  }
};

export const AgentV2StreamingTodo: React.FC<IAgentV2StreamingTodoProps> = ({ todoState, className }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayTodos, setDisplayTodos] = useState<ITodoUpdateItem[]>([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);

  console.log('[AgentV2StreamingTodo] Received todoState:', {
    hasActiveTodos: todoState.hasActiveTodos,
    currentTodos: todoState.currentTodos?.length || 0,
    isStreaming: todoState.isStreaming,
    animationVersion: todoState.animationVersion,
    updateHistory: todoState.updateHistory?.length || 0,
  });

  const updateSequence = createUpdateSequence(todoState.currentTodos, todoState.updateHistory);

  // 处理动态更新序列
  useEffect(() => {
    console.log('[AgentV2StreamingTodo] Processing update sequence:', {
      isStreaming: todoState.isStreaming,
      sequenceLength: updateSequence.length,
      currentTodos: todoState.currentTodos?.length || 0,
    });

    if (todoState.isStreaming && updateSequence.length > 1) {
      // 流式更新：逐步播放更新序列
      let sequenceIndex = 0;
      const interval = setInterval(() => {
        if (sequenceIndex < updateSequence.length) {
          setDisplayTodos(updateSequence[sequenceIndex]);
          setCurrentSequenceIndex(sequenceIndex);
          sequenceIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800); // 每800ms更新一次

      return () => clearInterval(interval);
    } else {
      // 非流式：直接显示最终状态
      console.log('[AgentV2StreamingTodo] Setting display todos directly:', todoState.currentTodos);
      setDisplayTodos(todoState.currentTodos);
      setCurrentSequenceIndex(updateSequence.length - 1);
    }
  }, [todoState.currentTodos, todoState.isStreaming, todoState.animationVersion, updateSequence]);

  // 统计完成状态
  const completedCount = displayTodos.filter((item) => item.completed).length;
  const totalCount = displayTodos.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPreview = () => {
    if (displayTodos.length === 0) return '暂无任务';
    const firstFew = displayTodos
      .slice(0, 2)
      .map((item) => item.content)
      .join('、');
    return totalCount > 2 ? `${firstFew} 等${totalCount}个任务` : firstFew;
  };

  if (!todoState.hasActiveTodos) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('relative z-10', className)}
    >
      <Card
        className={cn(
          'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-sm',
          className?.includes('compact-mode') && 'border-blue-100 bg-blue-50/50 shadow-none',
        )}
      >
        <CardHeader
          className={cn('cursor-pointer pb-3 transition-colors hover:bg-blue-100/50', !isExpanded && 'pb-4')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-base text-blue-900">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckSquare className="size-4 text-blue-600" />
                {todoState.isStreaming && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Zap className="size-3 text-amber-500" />
                  </motion.div>
                )}
                {!todoState.isStreaming && <Clock className="size-3 text-amber-500" />}
              </div>
              任务规划 {todoState.isStreaming && <span className="text-xs text-blue-700">(实时更新中)</span>}
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <span>
                  ({completedCount}/{totalCount})
                </span>
                {progress > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-blue-200">
                      <motion.div
                        className="h-full bg-blue-600 transition-all duration-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
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
                {displayTodos.length === 0 ? (
                  <p className="py-4 text-center text-sm text-blue-600">暂无任务项目</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {displayTodos.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${todoState.animationVersion}`}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor: item.completed ? '#dbeafe' : '#ffffff',
                        }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          backgroundColor: { duration: 0.5 },
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 transition-all duration-500',
                          getStatusStyles(item.status, item.completed).container,
                        )}
                      >
                        <motion.div
                          className="flex-shrink-0"
                          animate={{
                            scale: item.status === 'completed' ? 1.1 : 1,
                            rotate: item.status === 'completed' ? [0, 10, -10, 0] : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {getStatusIcon(item.status, item.completed)}
                        </motion.div>
                        <motion.span
                          className={cn(
                            'flex-1 text-sm leading-relaxed',
                            getStatusStyles(item.status, item.completed).text,
                          )}
                          transition={{ duration: 0.3 }}
                        >
                          {item.content}
                        </motion.span>
                        <AnimatePresence>
                          {item.status === 'completed' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex-shrink-0 text-xs font-medium text-green-600"
                            >
                              ✓ 完成
                            </motion.div>
                          )}
                          {item.status === 'in_progress' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex-shrink-0 text-xs font-medium text-yellow-600"
                            >
                              ⚡ 进行中
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* 更新进度指示器 */}
                {updateSequence.length > 1 && (
                  <motion.div
                    className="mt-4 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {updateSequence.map((_, index) => (
                      <motion.div
                        key={index}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                          index <= currentSequenceIndex ? 'bg-blue-500' : 'bg-blue-200',
                        )}
                        animate={{
                          scale: index === currentSequenceIndex ? 1.2 : 1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* 流式状态指示 */}
                {todoState.isStreaming && (
                  <motion.div
                    className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex gap-1">
                      <div className="size-1 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
                      <div className="size-1 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
                      <div className="size-1 animate-bounce rounded-full bg-blue-500"></div>
                    </div>
                    <span>智能体正在更新任务状态...</span>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
