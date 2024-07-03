import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { BugPlay, Fullscreen, Minimize, RotateCcw, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { VinesActuatorDetail } from '@/components/layout/vines-view/execution/actuator/detail';
import { ActuatorHeader } from '@/components/layout/vines-view/execution/actuator/header.tsx';
import { ActuatorToolList } from '@/components/layout/vines-view/execution/actuator/list.tsx';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { ExecutionTimer } from '@/components/layout/vines-view/flow/toolbar/expand/execution/execution-timer.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Toggle } from '@/components/ui/toggle.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { useViewStore } from '@/store/useViewStore';
import VinesEvent from '@/utils/events.ts';

interface IVinesActuatorProps {
  height: number;
}

export const VinesActuator: React.FC<IVinesActuatorProps> = ({ height }) => {
  const { t } = useTranslation();

  const { setCanvasMode } = useCanvasStore();
  const { visible, fullscreen, setFullscreen } = useViewStore();

  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;
  const hasExecution = workflowExecution !== null;

  const workflowStatus = workflowExecution?.status ?? '';
  const isExecutionPaused = workflowStatus === 'PAUSED';
  const isExecutionRunning = workflowStatus === 'RUNNING' || isExecutionPaused;

  const hasWorkflowVariables = vines.workflowInput.length > 0;

  const [activeTool, setActiveTool] = useState<VinesNode>();

  useEffect(() => {
    if (vines.executionInstanceId && visible) {
      void vines.fetchWorkflowExecution().then(() => vines.emit('refresh'));
    }
  }, [visible]);

  const actuatorHeight = height - 64;

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  return (
    <AnimatePresence>
      {hasExecution ? (
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle className="h-9 p-2" variant="outline" pressed={fullscreen} onPressedChange={setFullscreen}>
                    {fullscreen ? <Minimize size={16} /> : <Fullscreen size={16} />}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>
                  {fullscreen ? t('workspace.pre-view.actuator.scale.min') : t('workspace.pre-view.actuator.scale.max')}
                </TooltipContent>
              </Tooltip>
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
                  startTime={workflowExecution.startTime ?? 0}
                  endTime={workflowExecution.endTime ?? 0}
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
      ) : (
        <motion.div
          key="vines-preview-input"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative size-full"
        >
          {hasWorkflowVariables ? (
            <VinesWorkflowInput
              inputs={vines.workflowInput}
              height={height - 46}
              onSubmit={(inputData) => {
                vines.start({ inputData });
                setCanvasMode(CanvasStatus.RUNNING);
              }}
            >
              <Button variant="outline" type="submit" disabled={openAIInterfaceEnabled}>
                {t(
                  openAIInterfaceEnabled
                    ? 'workspace.pre-view.disable.exec-button-tips'
                    : 'workspace.pre-view.actuator.execution.label',
                )}
              </Button>
            </VinesWorkflowInput>
          ) : (
            <div className="absolute top-0 flex size-full flex-col items-center justify-center gap-4">
              <BugPlay size={80} strokeWidth={1.5} />
              <Button
                variant="outline"
                onClick={() => {
                  vines.start({});
                  setCanvasMode(CanvasStatus.RUNNING);
                }}
                disabled={openAIInterfaceEnabled}
              >
                {t(
                  openAIInterfaceEnabled
                    ? 'workspace.pre-view.disable.exec-button-tips'
                    : 'workspace.pre-view.actuator.execution.label',
                )}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
