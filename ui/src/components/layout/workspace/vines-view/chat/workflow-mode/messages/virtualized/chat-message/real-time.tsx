import React, { memo, RefObject, useEffect, useState } from 'react';

import { VirtuosoHandle } from 'react-virtuoso';

import { VinesActuatorDetailData } from '@/components/layout/workspace/vines-view/_common/actuator/detail/content/data.tsx';
import { ExecutionStatusIcon } from '@/components/layout/workspace/vines-view/_common/status-icon';
import { VinesBotChatMessage } from '@/components/layout/workspace/vines-view/chat/workflow-mode/messages/virtualized/chat-message/bot.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn, getI18nContent } from '@/utils';

interface IRealTimeToolOutputs {
  status: VinesNodeExecutionTask['status'];
  icon: string;
  name: string;
  customName?: string;
  description: string;
  execution?: VinesNodeExecutionTask;
}

interface IVinesRealTimeChatMessageProps {
  context: {
    virtuosoRef: RefObject<VirtuosoHandle>;
  };
}

export const VinesRealTimeChatMessage = memo((props) => {
  const { vines, VINES_REFRESHER } = useVinesFlow();
  const {
    context: { virtuosoRef },
  } = props as IVinesRealTimeChatMessageProps;
  const workflowStatus = vines.executionStatus();

  const [outputs, setOutputs] = useState<IRealTimeToolOutputs[]>([]);

  useEffect(() => {
    const nodes = vines.getAllNodes();

    const toolOutputs: IRealTimeToolOutputs[] = [];
    for (const node of nodes.slice(1, nodes.length - 1)) {
      const execution = node.getExecutionTask();
      const nodeStatus = execution?.status;
      if (nodeStatus === 'DEFAULT' && workflowStatus !== 'SCHEDULED') continue;
      const { name: toolName } = node.getRaw();
      const tool = vines.getTool(toolName);
      const customData = node.customData;

      const toolDesc = getI18nContent(tool?.description ?? '');
      const customDesc = customData?.description ?? '';

      toolOutputs.push({
        status: nodeStatus,
        icon: customData?.icon ?? tool?.icon ?? '',
        name: getI18nContent(tool?.displayName) ?? toolName,
        customName: customData?.title ?? '',
        description: customDesc ? `${customDesc} / ${toolDesc}` : `${toolDesc}`,
        execution,
      });
    }

    setOutputs(toolOutputs);
  }, [VINES_REFRESHER]);

  const instanceId = vines.executionInstanceId;
  const botPhoto = vines.workflowIcon;

  return (
    <VinesBotChatMessage
      className={cn('pt-4', !['RUNNING', 'PAUSED'].includes(workflowStatus) && 'hidden')}
      status={workflowStatus as VinesWorkflowExecution['status']}
      botPhoto={botPhoto}
      instanceId={instanceId}
    >
      <SmoothTransition
        className="overflow-hidden"
        onAnimationComplete={() =>
          setTimeout(() => virtuosoRef.current?.scrollToIndex({ align: 'end', behavior: 'smooth', index: 'LAST' }), 32)
        }
      >
        <div className="flex flex-col gap-4">
          {outputs.map(({ icon, name, customName, description, execution }, i) => (
            <Card className="flex flex-col gap-2 p-2" key={i}>
              <CardHeader className="flex flex-row items-center justify-between p-0">
                <div className="flex items-center gap-2">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border shadow-sm">
                    <VinesIcon src={icon} size="lg" />
                  </div>
                  <div className="flex max-w-[13rem] flex-col gap-1 leading-5">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-end gap-2">
                            <p className="line-clamp-1 text-sm font-bold leading-tight">{customName || name}</p>
                            {customName && (
                              <span className="line-clamp-1 min-w-[3rem] text-xs font-light text-gray-10">{name}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                          {`${customName}${customName ? ' / ' : ''}${name}`}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="line-clamp-1 !text-xs font-normal opacity-50">{description}</div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64" side="bottom">
                        {description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="mx-2 flex flex-1 justify-end">
                  <ExecutionStatusIcon status={workflowStatus} workflowStatus={workflowStatus} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <VinesActuatorDetailData executionTask={execution} height={265} />
              </CardContent>
            </Card>
          ))}
        </div>
      </SmoothTransition>
    </VinesBotChatMessage>
  );
});

VinesRealTimeChatMessage.displayName = 'VinesRealTimeChatMessage';
