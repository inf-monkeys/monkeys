import React, { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { BugPlay, Fullscreen, Minimize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VinesExecutionHistory } from 'src/components/layout/vines-view/execution/history';

import { VinesActuator } from '@/components/layout/vines-view/execution/actuator';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Toggle } from '@/components/ui/toggle.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesPreView: React.FC = () => {
  const { t } = useTranslation();

  const { setCanvasMode } = useCanvasStore();
  const { visible, fullscreen, setFullscreen } = useViewStore();
  const { containerHeight, workbenchVisible } = usePageStore();

  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;
  const hasExecution = workflowExecution !== null;

  const hasWorkflowVariables = vines.workflowInput.length > 0;

  useEffect(() => {
    if (vines.executionInstanceId && visible) {
      void vines.fetchWorkflowExecution().then(() => vines.emit('refresh'));
    }
  }, [visible]);

  const height = containerHeight - 54;

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  return (
    <motion.div
      className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <aside className={cn('relative w-3/5', fullscreen && 'w-full')}>
        <AnimatePresence>
          {hasExecution ? (
            <VinesActuator height={height}>
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
            </VinesActuator>
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
      </aside>
      <Separator orientation="vertical" className={cn('mx-3', fullscreen && 'hidden')} />
      <div className={cn('flex-1', fullscreen && 'hidden')}>
        <VinesExecutionHistory />
      </div>
    </motion.div>
  );
};
