import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { BugPlay } from 'lucide-react';

import { VinesActuatorDetail } from '@/components/layout/vines-execution/actuator/detail';
import { ActuatorHeader } from '@/components/layout/vines-execution/actuator/header.tsx';
import { ActuatorToolList } from '@/components/layout/vines-execution/actuator/list.tsx';
import { VinesWorkflowInput } from '@/components/layout/vines-execution/workflow-input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface IVinesActuatorProps {
  height: number;
}

export const VinesActuator: React.FC<IVinesActuatorProps> = ({ height }) => {
  const { setCanvasMode } = useFlowStore();
  const { vines } = useVinesFlow();

  const workflowExecution = vines.executionWorkflowExecution;
  const workflowStatus = workflowExecution?.status ?? '';

  const hasExecution = workflowExecution !== null;

  const hasWorkflowVariables = vines.workflowInput.length > 0;

  const [activeTool, setActiveTool] = useState<VinesNode>();

  useEffect(() => {
    if (vines.executionInstanceId) {
      void vines.fetchWorkflowExecution().then(() => vines.emit('refresh'));
    }
  }, []);

  const actuatorHeight = height - 64;

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
          <ActuatorHeader workflowStatus={workflowStatus} instanceId={vines.executionInstanceId} />
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
              <Button variant="outline" type="submit">
                运行工作流
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
              >
                运行工作流
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
