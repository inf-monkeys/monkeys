import React, { useEffect, useMemo, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { useClipboard } from '@mantine/hooks';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { EXECUTION_STATUS_LIST } from '@/components/layout/vines-view/execution-log/filter/consts.ts';
import { WorkflowVersionTag } from '@/components/layout/vines-view/execution-log/item/version-tag';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';
import { formatTimeDiffPrevious, formatTimeGap } from '@/utils/time.ts';

interface IVinesLogItemProps {
  onClick?: (instanceId: string) => void;
  workflowExecution: VinesWorkflowExecution;
  workflowDefinition: MonkeyWorkflow;
}

export const VinesLogItem: React.FC<IVinesLogItemProps> = ({ workflowDefinition, workflowExecution, onClick }) => {
  const clipboard = useClipboard({ timeout: 500 });

  const statusMapper = useMemo(() => {
    const mapper: Record<string, string> = {};
    EXECUTION_STATUS_LIST.forEach(({ status, text }) => {
      if (status) mapper[status] = text;
    });
    return mapper;
  }, [EXECUTION_STATUS_LIST]);

  const [timelapse, setTimelapse] = useState('');

  useEffect(() => {
    if (workflowExecution.endTime) {
      const gap = formatTimeGap(workflowExecution.endTime, workflowExecution.startTime);
      setTimelapse(gap);
    } else {
      setTimeout(() => setTimelapse(formatTimeGap(Date.now(), workflowExecution.startTime)), 1000);
    }
  }, [timelapse, workflowExecution]);

  const instanceId = workflowExecution.workflowId!;

  return (
    <Card>
      <Tooltip>
        <TooltipTrigger asChild>
          <CardContent
            className="flex cursor-pointer items-center p-4 text-xs hover:bg-gray-10/5 active:bg-gray-10/10"
            onClick={() => onClick?.(instanceId)}
          >
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-shrink-0">
                <VinesIcon src={workflowDefinition.iconUrl} size="sm" />
              </div>
              <div>
                <div className="line-clamp-1 flex items-center gap-2 font-bold">
                  {workflowDefinition.displayName}
                  <WorkflowVersionTag version={workflowExecution.workflowDefinition?.version ?? 1} />
                  <Tag size="xs" color="tertiary">
                    {getDescOfTriggerType(workflowExecution.triggerType)}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <CardDescription>实例 ID: {instanceId}</CardDescription>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="-m-2 scale-50"
                        icon={<Copy />}
                        onClick={(e) => {
                          e.stopPropagation();
                          clipboard.copy(instanceId);
                          toast.success('已复制实例 ID');
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>点击复制</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col">
              <div className="flex w-24 items-center gap-2">
                <div
                  className={cn('h-[8px] w-[8px] rounded-full', {
                    'bg-green-10': workflowExecution.status === 'COMPLETED',
                    'bg-blue-10': workflowExecution.status === 'RUNNING',
                    'bg-yellow-10': workflowExecution.status === 'PAUSED',
                    'bg-red-10': workflowExecution.status === 'FAILED',
                    'bg-gray-10': workflowExecution.status === 'TERMINATED' || workflowExecution.status === 'TIMED_OUT',
                  })}
                />
                <span>{workflowExecution.status ? statusMapper[workflowExecution.status] : 'UNKNOWN'}</span>
              </div>
              <span className="ml-4 opacity-50">{timelapse}</span>
            </div>

            <span className="w-32 flex-shrink-0 opacity-50">
              于 {formatTimeDiffPrevious(workflowExecution.startTime ?? 0)}
            </span>
          </CardContent>
        </TooltipTrigger>
        <TooltipContent>点击查看实例详情</TooltipContent>
      </Tooltip>
    </Card>
  );
};
