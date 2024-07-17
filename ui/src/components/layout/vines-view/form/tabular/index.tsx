import React, { useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { TabularRender } from '@/components/layout/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';

interface IVinesTabularProps extends React.ComponentPropsWithoutRef<'div'> {
  setConfigVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VinesTabular: React.FC<IVinesTabularProps> = () => {
  const { t } = useTranslation();

  const { containerHeight } = usePageStore();
  const { setCanvasMode } = useCanvasStore();

  const { vines } = useVinesFlow();

  const submitButton = useRef<HTMLButtonElement>(null);

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  return (
    <div className="flex flex-col pr-6">
      <div className="flex-1">
        <TabularRender
          inputs={vines.workflowInput}
          height={containerHeight - 100}
          onSubmit={(inputData) => {
            vines.start({ inputData });
            setCanvasMode(CanvasStatus.RUNNING);
            toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
          }}
        >
          <Button ref={submitButton} className="hidden" type="submit" />
        </TabularRender>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => submitButton.current?.click()}
          disabled={openAIInterfaceEnabled}
        >
          {t(
            openAIInterfaceEnabled
              ? 'workspace.pre-view.disable.exec-button-tips'
              : 'workspace.pre-view.actuator.execution.label',
          )}
        </Button>
        {/*<Tooltip>*/}
        {/*  <TooltipTrigger asChild>*/}
        {/*    <Button icon={<SettingsIcon />} variant="outline" onClick={() => setConfigVisible(true)} />*/}
        {/*  </TooltipTrigger>*/}
        {/*  <TooltipContent>配置表单</TooltipContent>*/}
        {/*</Tooltip>*/}
      </div>
    </div>
  );
};
