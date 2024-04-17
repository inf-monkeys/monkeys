import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { CheckCircle } from 'lucide-react';

import { useKnowledgeBaseTasks } from '@/apis/vector';
import { KnowledgebaseTaskStatus } from '@/apis/vector/typings';
import { ActiveTask } from '@/components/layout/ugc-pages/text-data/text-detail/header/task-active.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ITaskListProps {
  knowledgeBaseId: string;
}

export const TaskList: React.FC<ITaskListProps> = ({ knowledgeBaseId }) => {
  const { data, isLoading } = useKnowledgeBaseTasks(knowledgeBaseId);
  const isActiveTask = data?.list?.filter(
    (task) => task.status !== KnowledgebaseTaskStatus.COMPLETED && KnowledgebaseTaskStatus.FAILED,
  )?.[0];

  const getColor = (
    status: KnowledgebaseTaskStatus,
  ): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case KnowledgebaseTaskStatus.COMPLETED:
        return 'success';
      case KnowledgebaseTaskStatus.FAILED:
        return 'default';
      case KnowledgebaseTaskStatus.PENDING:
        return 'default';
      case KnowledgebaseTaskStatus.IN_PROGRESS:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Card className="flex h-8 cursor-pointer items-center justify-center gap-2 px-2 py-1 hover:bg-accent hover:text-accent-foreground">
              {isLoading ? (
                <CircularProgress
                  className="-m-3 scale-[0.4] [&_circle:last-child]:stroke-vines-500"
                  size="lg"
                  aria-label="Loading..."
                />
              ) : isActiveTask ? (
                <ActiveTask knowledgeBaseId={knowledgeBaseId} taskId={isActiveTask.id} />
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span className="text-xs">所有任务已完成</span>
                </>
              )}
            </Card>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent className="w-[24rem]">
          <ScrollArea className="h-52">
            <div className="flex flex-col gap-2">
              {data?.list?.map((task, i) => {
                const currentProgress = (task?.progress ?? 0) * 100;
                return (
                  <Card className="flex items-center gap-2 p-2" key={i}>
                    {currentProgress === 100 ? (
                      <CheckCircle size={28} />
                    ) : (
                      <CircularProgress
                        className="scale-80 [&_circle:last-child]:stroke-vines-500"
                        size="lg"
                        value={currentProgress}
                        aria-label="Loading..."
                        color={getColor(task.status)}
                      />
                    )}
                    <div className="flex flex-col">
                      <h1 className="text-sm">{task.id}</h1>
                      <span className="text-xs leading-tight text-muted-foreground">{task?.latestMessage}</span>
                    </div>
                  </Card>
                );
              })}
              <p className="mt-2 w-full text-center text-xs text-muted-foreground">没有更多了</p>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <TooltipContent>任务列表{isLoading ? '（加载中）' : isActiveTask ? '（正在处理文件）' : ''}</TooltipContent>
    </Tooltip>
  );
};
