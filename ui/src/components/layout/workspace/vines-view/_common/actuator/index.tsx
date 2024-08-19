import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { t } from 'i18next';
import { ChevronRight, RotateCcw, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

import { VinesActuatorDetail } from '@/components/layout/workspace/vines-view/_common/actuator/detail';
import { ActuatorHeader } from '@/components/layout/workspace/vines-view/_common/actuator/header.tsx';
import { ActuatorToolList } from '@/components/layout/workspace/vines-view/_common/actuator/list.tsx';
import { ExecutionTimer } from '@/components/layout/workspace/vines-view/flow/toolbar/expand/execution/execution-timer.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesActuatorProps {
  height: number;
  children?: React.ReactNode;
}

export const VinesActuator: React.FC<IVinesActuatorProps> = ({ height, children }) => {
  const [activeTool, setActiveTool] = useState<VinesNode>();

  const setCanvasMode = useCanvasStore((s) => s.setCanvasMode);

  const [sidebarVisible, setSidebarVisible] = useState(document.body.clientWidth > 520);

  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;

  const workflowStatus = workflowExecution?.status ?? '';
  const isExecutionPaused = workflowStatus === 'PAUSED';
  const isExecutionRunning = workflowStatus === 'RUNNING' || isExecutionPaused;

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const hasWorkflowVariables = vines.workflowInput.length > 0;

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
                className={hasWorkflowVariables || openAIInterfaceEnabled ? 'hidden' : ''}
                variant="outline"
                icon={isExecutionRunning ? <StopCircle size={16} /> : <RotateCcw size={16} />}
                onClick={() => {
                  if (isExecutionRunning) {
                    vines.stop();
                  } else {
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
        <motion.div
          initial={{ width: sidebarVisible ? 352 : 0, paddingRight: sidebarVisible ? 4 : 0 }}
          animate={{
            width: sidebarVisible ? 352 : 0,
            paddingRight: sidebarVisible ? 6 : 0,
            transition: { duration: 0.2 },
          }}
        >
          <ActuatorToolList height={actuatorHeight} activeTool={activeTool} setActiveTool={setActiveTool} />
        </motion.div>
        <Separator orientation="vertical" className="vines-center ml-2 mr-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
          </Tooltip>
        </Separator>
        <VinesActuatorDetail executionTask={activeTool?.executionTask} height={actuatorHeight} />
      </div>
    </motion.div>
  );
};
