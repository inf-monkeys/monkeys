import React, { useEffect, useMemo, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { VinesActuator } from '@/components/layout/vines-view/execution/actuator';
import { EXECUTION_STATUS_LIST } from '@/components/layout/vines-view/execution-log/log/filter/consts.ts';
import { WorkflowVersionTag } from '@/components/layout/vines-view/execution-log/log/item/version-tag';
import { AccordionContent, AccordionItem } from '@/components/ui/accordion.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useCopy } from '@/hooks/use-copy.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn, getI18nContent } from '@/utils';
import { formatTimeDiffPrevious, formatTimeGap } from '@/utils/time.ts';

interface IVinesLogItemProps {
  workflowExecution: VinesWorkflowExecution;
  workflowDefinition: MonkeyWorkflow;
  disabled?: boolean;
}

export const VinesLogItem: React.FC<IVinesLogItemProps> = ({ workflowDefinition, workflowExecution, disabled }) => {
  const { t } = useTranslation();
  const { copy } = useCopy({ timeout: 500 });

  const { vines } = useVinesFlow();

  const statusMapper = useMemo(() => {
    const mapper: Record<string, string> = {};
    EXECUTION_STATUS_LIST.forEach((text) => {
      if (text) mapper[text] = t([`common.workflow.status.${text}`, text]);
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
    <AccordionItem value={instanceId}>
      <Card>
        <Tooltip>
          <AccordionPrimitive.Trigger asChild>
            <TooltipTrigger asChild disabled={disabled}>
              <CardContent
                className="flex cursor-pointer items-center p-4 text-xs hover:bg-gray-10/5 active:bg-gray-10/10"
                onClick={() => vines.swapExecutionInstance(workflowExecution)}
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex-shrink-0">
                    <VinesIcon src={workflowDefinition.iconUrl} size="sm" />
                  </div>
                  <div>
                    <div className="line-clamp-1 flex items-center gap-2 font-bold">
                      {getI18nContent(workflowDefinition.displayName)}
                      <WorkflowVersionTag version={workflowExecution.workflowDefinition?.version ?? 1} />
                      <Tag size="xs" color="tertiary">
                        {getDescOfTriggerType(workflowExecution.triggerType)}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardDescription>{t('workspace.logs-view.log.list.item.desc', { instanceId })}</CardDescription>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="-m-2 scale-50"
                            variant="outline"
                            icon={<Copy />}
                            onClick={(e) => {
                              e.stopPropagation();
                              copy(instanceId);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
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
                        'bg-gray-10':
                          workflowExecution.status === 'TERMINATED' || workflowExecution.status === 'TIMED_OUT',
                      })}
                    />
                    <span>{workflowExecution.status ? statusMapper[workflowExecution.status] : 'UNKNOWN'}</span>
                  </div>
                  <span className="ml-4 opacity-50">{timelapse}</span>
                </div>

                <span className="w-32 flex-shrink-0 opacity-50">
                  {t('workspace.logs-view.log.list.item.exec-time', {
                    time: formatTimeDiffPrevious(workflowExecution.startTime ?? 0),
                  })}
                </span>
              </CardContent>
            </TooltipTrigger>
          </AccordionPrimitive.Trigger>

          <TooltipContent>{t('workspace.logs-view.log.list.item.tips')}</TooltipContent>
        </Tooltip>
        <AccordionContent className="space-y-1 p-4 pt-0">
          <Separator className="mb-4" />
          <div className="relative h-[32rem] w-full">
            <VinesActuator height={512} />
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};
