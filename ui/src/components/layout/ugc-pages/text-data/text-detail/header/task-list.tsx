import React from 'react';

import { CheckCircle, CircleX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBaseTasks } from '@/apis/vector';
import { KnowledgebaseTaskStatus } from '@/apis/vector/typings';
import { ActiveTask } from '@/components/layout/ugc-pages/text-data/text-detail/header/task-active.tsx';
import { Card } from '@/components/ui/card.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface ITaskListProps {
  knowledgeBaseId: string;
}

export const TaskList: React.FC<ITaskListProps> = ({ knowledgeBaseId }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useKnowledgeBaseTasks(knowledgeBaseId);
  const isActiveTask = data?.list?.filter(
    (task) => ![KnowledgebaseTaskStatus.FAILED, KnowledgebaseTaskStatus.COMPLETED].includes(task?.status ?? ''),
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
            <Card
              className={cn(
                'flex h-8 max-w-96 cursor-pointer items-center justify-center gap-2 px-2 py-1 hover:bg-accent hover:text-accent-foreground',
                !isActiveTask && 'pointer-events-none',
              )}
            >
              {isLoading ? (
                <VinesLoading size="sm" />
              ) : isActiveTask ? (
                <ActiveTask knowledgeBaseId={knowledgeBaseId} taskId={isActiveTask.id} />
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span className="text-xs">{t('ugc-page.text-data.detail.header.task-list.all-done')}</span>
                </>
              )}
            </Card>
          </TooltipTrigger>
        </PopoverTrigger>
        {isActiveTask && (
          <PopoverContent className="w-full min-w-[24rem] max-w-[30rem]">
            <ScrollArea className="h-52">
              <div className="flex flex-col gap-2">
                {data?.list?.map((task, i) => {
                  const currentProgress = (task?.progress ?? 0) * 100;
                  const currentStatus = task?.status ?? KnowledgebaseTaskStatus.PENDING;
                  const latestMessage = task?.latestMessage ?? 'No logs';
                  return (
                    <Card className="flex items-start gap-2 p-2" key={i}>
                      <div className="pt-1">
                        {currentProgress === 100 ? (
                          <CheckCircle size={28} strokeWidth={2.5} className="stroke-vines-500" />
                        ) : currentStatus === KnowledgebaseTaskStatus.FAILED ? (
                          <CircleX size={28} strokeWidth={2.5} className="stroke-red-10" />
                        ) : (
                          <VinesLoading color={getColor(currentStatus)} value={currentProgress} size="md" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h1 className="text-sm">{task.id}</h1>
                        <span className="text-xs leading-tight text-muted-foreground">
                          {t([`ugc-page.text-data.detail.header.task-list.message.${latestMessage}`, latestMessage])}
                        </span>
                      </div>
                    </Card>
                  );
                })}
                <p className="mt-2 w-full text-center text-xs text-muted-foreground">{t('common.load.no-more')}</p>
              </div>
            </ScrollArea>
          </PopoverContent>
        )}
      </Popover>
      <TooltipContent>
        {t('ugc-page.text-data.detail.header.task-list.tooltip.label', {
          status: isLoading
            ? t('ugc-page.text-data.detail.header.task-list.tooltip.loading')
            : isActiveTask
              ? t('ugc-page.text-data.detail.header.task-list.tooltip.processing')
              : '',
        })}
      </TooltipContent>
    </Tooltip>
  );
};
