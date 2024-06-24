import React from 'react';

import { get } from 'lodash';
import { LogOut, Play, RotateCcw, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ExecutionRecover } from '@/components/layout/vines-view/flow/toolbar/expand/execution/execution-recover.tsx';
import { ExecutionTimer } from '@/components/layout/vines-view/flow/toolbar/expand/execution/execution-timer.tsx';
import { ToolButton } from '@/components/layout/vines-view/flow/toolbar/tool-button.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesRunInsideToolbarProps {}

export const VinesRunInsideToolbar: React.FC<IVinesRunInsideToolbarProps> = () => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion } = useFlowStore();
  const { isWorkflowRUNNING, setCanvasMode } = useCanvasStore();
  const { setIsUserInteraction } = useCanvasInteractionStore();
  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;

  const disabled = vines.renderOptions.type !== IVinesFlowRenderType.COMPLICATE;

  const hasExecution = workflowExecution !== null;
  const isExecutionStatus = vines.executionStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const executionStartTime = get(workflowExecution, 'startTime', 0);
  const executionEndTime = get(workflowExecution, 'endTime', 0);

  const isReExecution = hasExecution && isWorkflowRUNNING;

  return (
    <Card className={cn('flex flex-nowrap gap-2 p-2', (!isLatestWorkflowVersion || disabled) && 'hidden')}>
      <ToolButton
        icon={isExecutionRunning ? <StopCircle /> : isReExecution ? <RotateCcw /> : <Play />}
        side="bottom"
        tip={
          isExecutionRunning
            ? t('workspace.flow-view.execution.stop')
            : isReExecution
              ? t('workspace.flow-view.execution.re-run')
              : t('workspace.flow-view.execution.start')
        }
        keys={['ctrl', 'F5']}
        onClick={() => {
          if (isExecutionRunning) {
            vines.stop();
          } else {
            const hasWorkflowVariables = vines.workflowInput.length > 0;
            if (hasWorkflowVariables) {
              setTimeout(() => VinesEvent.emit('canvas-zoom-to-node', 'complicate-workflow_start'));
              toast.info(t('workspace.flow-view.execution.workflow-input-empty'));
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
        className={hasExecution && isWorkflowRUNNING ? '' : 'hidden'}
        status={isExecutionStatus}
        startTime={executionStartTime}
        endTime={executionEndTime}
        onClick={() => (isExecutionPaused ? vines.resume() : vines.pause())}
      />
      <ExecutionRecover className={!isExecutionRunning && !isReExecution ? 'hidden' : ''} />
      {!isExecutionRunning && (
        <ToolButton
          className={cn(isWorkflowRUNNING ? '' : 'hidden')}
          icon={<LogOut />}
          tip={t('workspace.flow-view.execution.stop-and-edit')}
          side="bottom"
          onClick={() => {
            setCanvasMode(CanvasStatus.EDIT);
            setIsUserInteraction(null);
            setTimeout(() => VinesEvent.emit('canvas-auto-zoom'));
          }}
        />
      )}
    </Card>
  );
};
