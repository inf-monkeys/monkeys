import React, { useEffect, useMemo, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import moment from 'moment';

import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { EXECUTION_STATUS_LIST } from '@/components/layout/view/vines-log/filter/consts.ts';
import { WorkflowVersionTag } from '@/components/layout/view/vines-log/item/version-tag';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Tag } from '@/components/ui/tag';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';
import { formatTimeDiffPrevious, formatTimeGap } from '@/utils/time.ts';

interface IVinesLogItemProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowExecution: VinesWorkflowExecution;
  workflowDefinition: MonkeyWorkflow;
}

export const VinesLogItem: React.FC<IVinesLogItemProps> = ({ workflowDefinition, workflowExecution }) => {
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

  return (
    <Card>
      <CardContent className="flex p-4 text-xs">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex-shrink-0">
            <VinesIcon src={workflowDefinition.iconUrl} size="sm" />
          </div>
          <div>
            <div className="line-clamp-1 flex items-center gap-2 font-bold">
              {workflowDefinition.name}
              <WorkflowVersionTag
                //TODO: onClick
                // onClick={(version) => {
                //   if (version === -1) {
                //     return;
                //   }
                //   const workflow = versions.find((x) => x.version === version);
                //   setCurrentPreviewWorkflow(workflow);
                // }}
                version={workflowExecution.workflowDefinition?.version ?? 1}
              />
              <Tag size="xs" color="tertiary">
                {getDescOfTriggerType(workflowExecution.triggerType)}
              </Tag>
            </div>
            <div className="line-clamp-1 opacity-50">执行 ID: {workflowExecution.workflowId}</div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col">
          <div className="flex w-[140px] items-center gap-2">
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
          <div className="ml-4 opacity-50">{timelapse}</div>
        </div>

        <div className="w-[240px] flex-shrink-0">
          <div className="flex items-center gap-2">
            {/*//FIXME: 当前接口无法获得发起执行者的信息*/}
            {/*<Avatar className="size-4">*/}
            {/*  <AvatarImage className="aspect-auto" src={} alt={teamName} />*/}
            {/*  <AvatarFallback className="rounded-none p-2 text-xs">{teamName.substring(0, 2)}</AvatarFallback>*/}
            {/*</Avatar>*/}
            {/*<span className="line-clamp-1 opacity-70">{asUserName(user)}</span>*/}
            <div className="opacity-50">于 {formatTimeDiffPrevious(moment(workflowExecution.startTime).valueOf())}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
