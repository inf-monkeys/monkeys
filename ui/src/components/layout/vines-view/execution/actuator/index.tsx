import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { t } from 'i18next';
import { RotateCcw, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

import { VinesActuatorDetail } from '@/components/layout/vines-view/execution/actuator/detail';
import { ActuatorHeader } from '@/components/layout/vines-view/execution/actuator/header.tsx';
import { ActuatorToolList } from '@/components/layout/vines-view/execution/actuator/list.tsx';
import { ExecutionTimer } from '@/components/layout/vines-view/flow/toolbar/expand/execution/execution-timer.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import VinesEvent from '@/utils/events.ts';

interface IVinesActuatorProps {
  height: number;
  children?: React.ReactNode;
}

export const VinesActuator: React.FC<IVinesActuatorProps> = ({ height, children }) => {
  const [activeTool, setActiveTool] = useState<VinesNode>();

  const { setCanvasMode } = useCanvasStore();

  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;

  const workflowStatus = workflowExecution?.status ?? '';
  const isExecutionPaused = workflowStatus === 'PAUSED';
  const isExecutionRunning = workflowStatus === 'RUNNING' || isExecutionPaused;

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const actuatorHeight = height - 64;

  return (
    <motion.div
      key="vines-preview-execution"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 top-0 flex size-full flex-col gap-4"
    >
      <ActuatorHeader workflowStatus={workflowStatus} instanceId={vines.executionInstanceId}>
        <div className="flex gap-2">
          {children}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={openAIInterfaceEnabled ? 'hidden' : ''}
                variant="outline"
                icon={isExecutionRunning ? <StopCircle size={16} /> : <RotateCcw size={16} />}
                onClick={() => {
                  if (isExecutionRunning) {
                    vines.stop();
                  } else {
                    const hasWorkflowVariables = vines.workflowInput.length > 0;
                    if (hasWorkflowVariables) {
                      vines.executionWorkflowExecution = null;
                      toast.info(t('workspace.pre-view.actuator.execution.form-empty'));
                    } else {
                      vines.start({});
                      setTimeout(() => VinesEvent.emit('canvas-auto-zoom'));
                    }
                    setCanvasMode(hasWorkflowVariables ? CanvasStatus.WAIT_TO_RUNNING : CanvasStatus.RUNNING);
                  }
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              {isExecutionRunning
                ? t('workspace.pre-view.actuator.execution.button.stop')
                : t('workspace.pre-view.actuator.execution.button.restart')}
            </TooltipContent>
          </Tooltip>
          {workflowStatus && (
            <ExecutionTimer
              status={workflowStatus}
              startTime={workflowExecution?.startTime ?? 0}
              endTime={workflowExecution?.endTime ?? 0}
              onClick={() => (isExecutionPaused ? vines.resume() : vines.pause())}
            />
          )}
        </div>
      </ActuatorHeader>
      <div className="flex items-center" style={{ height: actuatorHeight }}>
        <div className="w-2/5">
          <ActuatorToolList height={actuatorHeight} activeTool={activeTool} setActiveTool={setActiveTool} />
        </div>
        <Separator orientation="vertical" className="ml-2 mr-6" />
        <VinesActuatorDetail executionTask={activeTool?.executionTask} height={actuatorHeight} />
      </div>
    </motion.div>
  );
};
