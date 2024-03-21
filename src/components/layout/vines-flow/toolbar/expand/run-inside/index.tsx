import React from 'react';

import { get } from 'lodash';
import { LogOut, Play, RotateCcw, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

import { ExecutionTimer } from '@/components/layout/vines-flow/toolbar/expand/run-inside/execution-timer.tsx';
import { ToolButton } from '@/components/layout/vines-flow/toolbar/tool-button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesRunInsideToolbarProps {}

export const VinesRunInsideToolbar: React.FC<IVinesRunInsideToolbarProps> = () => {
  const { isLatestWorkflowVersion, canvasMode, setCanvasMode, setZoomToNodeId, setIsUserInteraction } = useFlowStore();
  const { vines } = useVinesFlow();

  const workflowExecution = vines.runningWorkflowExecution;

  const disabled = vines.renderOptions.type !== IVinesFlowRenderType.COMPLICATE;

  const hasExecution = vines.runningWorkflowExecution !== null;
  const isExecutionStatus = vines.runningStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const executionStartTime = get(workflowExecution, 'startTime', 0);
  const executionEndTime = get(workflowExecution, 'endTime', 0);

  const isRUNNINGMode = [CanvasStatus.RUNNING, CanvasStatus.WAIT_TO_RUNNING].includes(canvasMode);
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
            const hasWorkflowVariables = vines.workflowInput.length > 0;
            if (hasWorkflowVariables) {
              setZoomToNodeId('complicate-workflow_start');
              setTimeout(() => VinesEvent.emit('canvas-zoom-to-node'));
              toast.info('请先完善工作流表单');
            } else {
              vines.start({});
              setIsUserInteraction(null);
              setTimeout(() => VinesEvent.emit('canvas-auto-zoom'));
            }
            setCanvasMode(hasWorkflowVariables ? CanvasStatus.WAIT_TO_RUNNING : CanvasStatus.RUNNING);
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
      {!isExecutionRunning && (
        <ToolButton
          className={cn(isRUNNINGMode ? '' : 'hidden')}
          icon={<LogOut />}
          tip="返回编辑模式"
          side="bottom"
          onClick={() => setCanvasMode(CanvasStatus.EDIT)}
        />
      )}
    </Card>
  );
};
