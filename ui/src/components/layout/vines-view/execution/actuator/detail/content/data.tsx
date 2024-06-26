import React from 'react';

import { CircularProgress } from '@nextui-org/progress';

import { VinesAbstractDataPreview } from '@/components/layout/vines-view/execution/data-display/abstract';
import { VinesExecutionHumanInteraction } from '@/components/layout/vines-view/execution/human-interaction';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IVinesActuatorDetailDataProps {
  executionTask?: VinesNodeExecutionTask;
  height?: number;
}

export const VinesActuatorDetailData: React.FC<IVinesActuatorDetailDataProps> = ({ executionTask, height }) => {
  const executionOutputData = executionTask?.outputData ?? {};
  const executionInputData = executionTask?.inputData ?? {};

  const isCompleted =
    Object.keys(executionOutputData).length > 0 ||
    !['IN_PROGRESS', 'SCHEDULED'].includes(executionTask?.originStatus ?? '');
  const isHUMANInteraction = executionTask?.taskType === 'HUMAN';

  return (
    <ScrollArea className="[&>div>div]:h-full" style={{ height }}>
      {isCompleted ? (
        <VinesAbstractDataPreview className="px-2" style={{ height }} data={executionOutputData} />
      ) : isHUMANInteraction ? (
        <VinesExecutionHumanInteraction
          height={height}
          instanceId={executionTask?.workflowInstanceId ?? ''}
          taskId={executionTask?.taskId ?? ''}
          inputData={executionInputData}
          taskDefName={executionTask?.taskDefName ?? ''}
          isCompleted={isCompleted}
        />
      ) : (
        <div className="vines-center size-full">
          <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
        </div>
      )}
    </ScrollArea>
  );
};
