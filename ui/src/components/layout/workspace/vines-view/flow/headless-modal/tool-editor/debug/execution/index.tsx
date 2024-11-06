import React, { useRef, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesActuator } from '@/components/layout/workspace/vines-view/_common/actuator';
import { TabularRender } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IToolDebugExecutionProps {
  height: number;
  task?: VinesTask;
  activeExecutionId: string;
  setActiveExecutionId: React.Dispatch<React.SetStateAction<string>>;
}

export const ToolDebugExecution: React.FC<IToolDebugExecutionProps> = ({
  height,
  activeExecutionId,
  setActiveExecutionId,
  task,
}) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const [singleInstance, setSingleInstance] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useMemoizedFn(async (inputData: IWorkflowInputForm) => {
    const tasks = singleInstance ? (task ? [task] : vines.getRaw()) : vines.getRaw();
    const instanceId = await vines.start({ inputData, tasks });
    if (instanceId && typeof instanceId === 'string') {
      setActiveExecutionId(instanceId);
      setLoading(false);
    }
  });

  const submitButton = useRef<HTMLButtonElement>(null);

  const inputs = vines.workflowInput;
  const workflowId = vines.workflowId;

  return (
    <div className="relative h-full">
      <AnimatePresence>
        {activeExecutionId ? (
          <motion.div
            key="vines-tool-debug-actuator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VinesActuator
              height={height}
              instanceId={activeExecutionId}
              onManualRestart={() => {
                setActiveExecutionId('');
                setLoading(false);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="vines-tool-debug-tabular"
            className="flex flex-col gap-2 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TabularRender
              inputs={inputs}
              height={height - 40}
              workflowId={workflowId}
              onSubmit={handleSubmit}
              fieldChildren={
                inputs.length ? (
                  <div className="col-span-2 -mt-2 w-full text-center text-xs text-gray-10">
                    {t('workspace.flow-view.headless-modal.tool-editor.debug.form-tips')}
                  </div>
                ) : null
              }
            >
              <Button ref={submitButton} className="hidden" type="submit" />
            </TabularRender>
            <div className={cn('flex w-full items-center justify-between', !task && 'pointer-events-none opacity-70')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      disabled={!task}
                      size="small"
                      checked={singleInstance}
                      onCheckedChange={setSingleInstance}
                    />
                    <Label className="text-xs">
                      {t('workspace.flow-view.headless-modal.tool-editor.debug.single-instance.label')}
                    </Label>

                    <Info size={12} className="-ml-1 cursor-pointer text-gray-10" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-96">
                  {t('workspace.flow-view.headless-modal.tool-editor.debug.single-instance.tips')}
                </TooltipContent>
              </Tooltip>
              <Button
                icon={<Play />}
                variant="outline"
                size="small"
                loading={loading}
                onClick={() => {
                  submitButton.current?.click();
                  setLoading(true);
                }}
              >
                {t('workspace.flow-view.headless-modal.tool-editor.debug.execution')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
