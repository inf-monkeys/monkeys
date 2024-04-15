import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { CheckCircle } from 'lucide-react';

import { useVectorTasks } from '@/apis/vector';
import { ActiveTask } from '@/components/layout/ugc-pages/text-data/text-detail/header/task-active.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ITaskListProps {
  textId: string;
}

export const TaskList: React.FC<ITaskListProps> = ({ textId }) => {
  const { data, isLoading } = useVectorTasks(textId);

  const isActiveTask = data?.filter((task) => !task.events?.find((event) => event.progress === 1))?.[0];

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
                <ActiveTask textId={textId} taskId={isActiveTask.taskId} />
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
              {data?.map((task, i) => {
                const currentEvent = task.events.at(-1);
                const currentProgress = (currentEvent?.progress ?? 0) * 100;
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
                      />
                    )}
                    <div className="flex flex-col">
                      <h1 className="text-sm">{task.taskId}</h1>
                      <span className="text-xs leading-tight text-muted-foreground">{currentEvent?.message}</span>
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
