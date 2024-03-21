import React from 'react';

import { get } from 'lodash';
import { LogOut, Play, RotateCcw, StopCircle } from 'lucide-react';

import { ExecutionTimer } from '@/components/layout/vines-flow/toolbar/expand/run-inside/execution-timer.tsx';
import { ToolButton } from '@/components/layout/vines-flow/toolbar/tool-button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';

interface IVinesRunInsideToolbarProps {}

export const VinesRunInsideToolbar: React.FC<IVinesRunInsideToolbarProps> = () => {
  const { isLatestWorkflowVersion, canvasMode, setCanvasMode } = useFlowStore();
  const { vines } = useVinesFlow();

  const workflowExecution = vines.runningWorkflowExecution;

  const disabled = vines.renderOptions.type !== IVinesFlowRenderType.COMPLICATE;

  const hasExecution = vines.runningWorkflowExecution !== null;
  const isExecutionStatus = vines.runningStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const executionStartTime = get(workflowExecution, 'startTime', 0);
  const executionEndTime = get(workflowExecution, 'endTime', 0);

  const isRUNNINGMode = canvasMode === CanvasStatus.RUNNING;
  const isReExecution = hasExecution && isRUNNINGMode;

  return (
    <Card className={cn('flex flex-nowrap gap-2 p-2', (!isLatestWorkflowVersion || disabled) && 'hidden')}>
      <ToolButton
        icon={isExecutionRunning ? <StopCircle /> : isReExecution ? <RotateCcw /> : <Play />}
        side="bottom"
        tip={isExecutionRunning ? '终止运行' : isReExecution ? '重新运行' : '视图内运行'}
        keys={['ctrl', 'F5']}
        onClick={() => {
          if (isExecutionRunning) {
            vines.stop();
          } else {
            vines.start({});
            setCanvasMode(CanvasStatus.RUNNING);
          }
        }}
      />
      <ExecutionTimer
        className={hasExecution && isRUNNINGMode ? '' : 'hidden'}
        status={isExecutionStatus}
        startTime={executionStartTime}
        endTime={executionEndTime}
        onClick={() => (isExecutionPaused ? vines.resume() : vines.pause())}
      />
      <ToolButton
        className={cn(isRUNNINGMode ? '' : 'hidden')}
        icon={<LogOut />}
        tip="返回编辑模式"
        side="bottom"
        onClick={() => setCanvasMode(CanvasStatus.EDIT)}
      />
    </Card>
  );
};
