import React, { useEffect } from 'react';

import { get } from 'lodash';
import { LogOut, Play, RotateCcw, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ExecutionRecover } from '@/components/layout/workspace/vines-view/flow/toolbar/expand/execution/execution-recover.tsx';
import { ExecutionTimer } from '@/components/layout/workspace/vines-view/flow/toolbar/expand/execution/execution-timer.tsx';
import { ToolButton } from '@/components/layout/workspace/vines-view/flow/toolbar/tool-button.tsx';
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

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const isWorkflowRUNNING = useCanvasStore((s) => s.isWorkflowRUNNING);
  const setCanvasMode = useCanvasStore((s) => s.setCanvasMode);
  const setIsUserInteraction = useCanvasInteractionStore((s) => s.setIsUserInteraction);

  const { vines, VINES_REFRESHER } = useVinesFlow();

  const workflowExecution = vines.getWorkflowExecution();

  const disabled = vines.renderOptions.type !== IVinesFlowRenderType.COMPLICATE;

  const hasExecution = workflowExecution !== null;
  const isExecutionStatus = vines.executionStatus();
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  useEffect(() => {
    if (isExecutionRunning) {
      const nodes = vines.getAllNodes();
      const activeNode = nodes
        .filter((node) => ['IN_PROGRESS', 'SCHEDULED'].includes(node.getExecutionTask()?.status ?? ''))
        .sort((a, b) => (a.getExecutionTask()?.startTime ?? 0) - (b.getExecutionTask()?.startTime ?? 0))
        .sort((a) => (['SUB_WORKFLOW', 'DO_WHILE'].includes(a.type) ? 1 : -1));

      let nodeId = '';
      if (activeNode?.[0]) {
        nodeId = activeNode[0]?.id;
      } else if (nodes?.[1]) {
        nodeId = nodes[1]?.id;
      }

      if (nodeId) {
        VinesEvent.emit('canvas-zoom-to-node', 'complicate-' + nodeId);
      }
    }
  }, [VINES_REFRESHER]);

  const executionStartTime = get(workflowExecution, 'startTime', 0);
  const executionEndTime = get(workflowExecution, 'endTime', 0);

  const isReExecution = hasExecution && isWorkflowRUNNING;

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  return (
    <Card
      className={cn(
        'flex flex-nowrap gap-2 p-2',
        (!isLatestWorkflowVersion || disabled || openAIInterfaceEnabled) && 'hidden',
      )}
    >
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
