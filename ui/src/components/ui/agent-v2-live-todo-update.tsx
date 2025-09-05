import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, ChevronDown, ChevronUp, Clock, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';
import { parseTodoUpdateContent } from '@/utils/todo-update-parser';

interface IAgentV2LiveTodoUpdateProps {
  todosText: string;
  className?: string;
  animationDelay?: number; // 每个状态变化的延迟时间
  enableLiveUpdate?: boolean; // 是否启用实时更新效果
}

// 解析todo状态变化序列
const parseTodoProgressSequence = (todosText: string) => {
  const items = parseTodoUpdateContent(todosText);
  const progressSteps: Array<{ stepIndex: number; items: typeof items }> = [];

  // 基于完成状态创建不同的进度步骤
  let currentStep = 0;
  const stepMap = new Map<string, number>();

  items.forEach((item) => {
    const key = `${item.completed}`;
    if (!stepMap.has(key)) {
      stepMap.set(key, currentStep++);
    }
  });

  // 创建进度序列：从所有未完成到逐步完成
  const completedItems = items.filter((item) => item.completed);
  const pendingItems = items.filter((item) => !item.completed);

  // 步骤0：所有任务都未完成
  progressSteps.push({
    stepIndex: 0,
    items: items.map((item) => ({ ...item, completed: false })),
  });

  // 逐步完成任务
  completedItems.forEach((_, index) => {
    const stepItems = items.map((item, itemIndex) => ({
      ...item,
      completed: itemIndex <= pendingItems.length + index,
    }));

    progressSteps.push({
      stepIndex: index + 1,
      items: stepItems,
    });
  });

  return { progressSteps, finalItems: items };
};

export const AgentV2LiveTodoUpdate: React.FC<IAgentV2LiveTodoUpdateProps> = ({
  todosText,
  className,
  animationDelay = 800,
  enableLiveUpdate = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayItems, setDisplayItems] = useState<ReturnType<typeof parseTodoUpdateContent>>([]);

  const { progressSteps, finalItems } = parseTodoProgressSequence(todosText);

  // 实时更新效果
  useEffect(() => {
    if (enableLiveUpdate && progressSteps.length > 1) {
      // 逐步更新状态
      progressSteps.forEach((step, index) => {
        setTimeout(() => {
          setCurrentStep(index);
          setDisplayItems(step.items);
        }, index * animationDelay);
      });
    } else {
      // 直接显示最终状态
      setDisplayItems(finalItems);
      setCurrentStep(progressSteps.length - 1);
    }
  }, [todosText, enableLiveUpdate, animationDelay, progressSteps, finalItems]);

  // 统计完成状态
  const completedCount = displayItems.filter((item) => item.completed).length;
  const totalCount = displayItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPreview = () => {
    if (displayItems.length === 0) return '暂无任务';
    const firstFew = displayItems
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
                {displayItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-blue-600">暂无任务项目</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {displayItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor: item.completed ? '#dbeafe' : '#ffffff',
                        }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                          delay: enableLiveUpdate ? index * 0.05 : 0,
                          duration: 0.3,
                          backgroundColor: { duration: 0.5 },
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 transition-all duration-500',
                          item.completed
                            ? 'border-blue-300 bg-blue-100/50 text-blue-800'
                            : 'border-blue-200 bg-white text-blue-900',
                        )}
                      >
                        <motion.div
                          className="flex-shrink-0"
                          animate={{
                            scale: item.completed ? 1.1 : 1,
                            rotate: item.completed ? [0, 10, -10, 0] : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {item.completed ? (
                            <CheckSquare className="size-4 text-blue-600" />
                          ) : (
                            <Square className="size-4 text-blue-400" />
                          )}
                        </motion.div>
                        <motion.span
                          className={cn('flex-1 text-sm leading-relaxed')}
                          animate={{
                            opacity: item.completed ? 0.75 : 1,
                            textDecoration: item.completed ? 'line-through' : 'none',
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {item.content}
                        </motion.span>
                        <AnimatePresence>
                          {item.completed && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex-shrink-0 text-xs font-medium text-blue-600"
                            >
                              ✓ 完成
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* 进度指示器 */}
                {enableLiveUpdate && progressSteps.length > 1 && (
                  <motion.div
                    className="mt-4 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {progressSteps.map((_, index) => (
                      <motion.div
                        key={index}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-colors duration-300',
                          index <= currentStep ? 'bg-blue-500' : 'bg-blue-200',
                        )}
                        animate={{
                          scale: index === currentStep ? 1.2 : 1,
                        }}
                      />
                    ))}
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
