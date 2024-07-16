import React, { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { BugPlay } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { VinesActuator } from '@/components/layout/vines-view/execution/actuator';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { ExecutionRecover } from '@/components/layout/vines-view/flow/toolbar/expand/execution/execution-recover.tsx';
import { Button } from '@/components/ui/button';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';

export const VinesPreView: React.FC = () => {
  const { t } = useTranslation();

  const { setCanvasMode } = useCanvasStore();
  const { visible } = useViewStore();
  const { containerHeight } = usePageStore();

  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;
  const hasExecution = workflowExecution !== null;
  const workflowId = vines.workflowId;

  const { data, mutate } = useSearchWorkflowExecutions(
    workflowId ? { workflowId, pagination: { page: 1, limit: 100 } } : null,
    0,
  );

  const vinesExecutionStatus = vines.executionStatus;

  useEffect(() => {
    if (!workflowId || !visible || !data) return;
    const executionInstance = data?.data?.find((it) => it.status === 'PAUSED' || it.status === 'RUNNING');
    const instanceId = executionInstance?.workflowId;
    if (instanceId) {
      vines.swapExecutionInstance(executionInstance);
      setCanvasMode(CanvasStatus.RUNNING);
    }
  }, [data]);

  useEffect(() => {
    !['SCHEDULED', 'CANCELED'].includes(vinesExecutionStatus) && mutate();
  }, [vinesExecutionStatus]);

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
      className="size-full p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative flex size-full items-center justify-center">
        <AnimatePresence>
          {hasExecution ? (
            <motion.div
              key="vines-actuator-form"
              className="relative mx-auto size-full max-w-7xl"
              style={{ height }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VinesActuator height={height}>
                <ExecutionRecover />
              </VinesActuator>
            </motion.div>
          ) : (
            <motion.div
              key="vines-form-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 size-full max-w-xl"
            >
              {hasWorkflowVariables ? (
                <VinesWorkflowInput
                  formClassName="w-full"
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
      </div>
    </motion.div>
  );
};
