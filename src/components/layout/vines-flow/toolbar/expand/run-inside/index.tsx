import React from 'react';

import { get } from 'lodash';
import { Play, RotateCcw, StopCircle } from 'lucide-react';

import { ExecutionTimer } from '@/components/layout/vines-flow/toolbar/expand/run-inside/execution-timer.tsx';
import { ToolButton } from '@/components/layout/vines-flow/toolbar/tool-button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IVinesRunInsideToolbarProps {}

export const VinesRunInsideToolbar: React.FC<IVinesRunInsideToolbarProps> = () => {
  const { isLatestWorkflowVersion } = useFlowStore();
  const { vines } = useVinesFlow();

  const workflowExecution = vines.runningWorkflowExecution;

  const disabled = vines.renderOptions.type !== IVinesFlowRenderType.COMPLICATE;

  const hasExecution = vines.runningWorkflowExecution !== null;
  const isExecutionStatus = vines.runningStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const executionStartTime = get(workflowExecution, 'startTime', 0);
  const executionEndTime = get(workflowExecution, 'endTime', 0);

  return (
    <Card className={cn('flex flex-nowrap gap-2 p-2', (!isLatestWorkflowVersion || disabled) && 'hidden')}>
      <ToolButton
        icon={isExecutionRunning ? <StopCircle /> : hasExecution ? <RotateCcw /> : <Play />}
        side="bottom"
        tip={isExecutionRunning ? '终止运行' : hasExecution ? '重新运行' : '视图内运行'}
        keys={['ctrl', 'F5']}
        onClick={() => (isExecutionRunning ? vines.stop() : vines.start({}))}
      />
      {hasExecution && (
        <ExecutionTimer
          status={isExecutionStatus}
          startTime={executionStartTime}
          endTime={executionEndTime}
          onClick={() => (isExecutionPaused ? vines.resume() : vines.pause())}
        />
      )}
    </Card>
  );
};
