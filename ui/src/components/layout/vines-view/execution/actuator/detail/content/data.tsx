import React from 'react';

import { VinesAbstractDataPreview } from '@/components/layout/vines-view/execution/data-display/abstract';
import { VinesExecutionHumanInteraction } from '@/components/layout/vines-view/execution/human-interaction';
import { VinesLoading } from '@/components/ui/loading';
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
    !['IN_PROGRESS', 'SCHEDULED'].includes(executionTask?.originStatus ?? '') ||
    ['DEFAULT', 'CANCELED'].includes(executionTask?.status ?? '');
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
          <VinesLoading />
        </div>
      )}
    </ScrollArea>
  );
};
