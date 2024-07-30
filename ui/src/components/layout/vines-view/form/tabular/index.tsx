import React, { useRef } from 'react';

import { useSWRConfig } from 'swr';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { TabularRender } from '@/components/layout/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesTabularProps extends React.ComponentPropsWithoutRef<'div'> {
  setHistoryVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isSmallFrame?: boolean;
  event$: EventEmitter<void>;
  minimalGap?: boolean;
}

export const VinesTabular: React.FC<IVinesTabularProps> = ({
  className,
  style,
  setHistoryVisible,
  isSmallFrame = false,
  event$,
  minimalGap,
}) => {
  const { mutate } = useSWRConfig();
  const { t } = useTranslation();

  const containerHeight = usePageStore((s) => s.containerHeight);
  const setCanvasMode = useCanvasStore((s) => s.setCanvasMode);

  const { vines } = useVinesFlow();

  const submitButton = useRef<HTMLButtonElement>(null);

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  return (
    <div className={cn('flex flex-col pr-6', className)} style={style}>
      <div className="flex-1">
        <TabularRender
          formClassName={cn(minimalGap && 'gap-0')}
          inputs={vines.workflowInput}
          height={containerHeight - 100 - (isSmallFrame ? 64 : 0)}
          onSubmit={(inputData) => {
            vines.start({ inputData }).then((status) => {
              if (status) {
                setCanvasMode(CanvasStatus.RUNNING);
                toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
                setHistoryVisible(true);
                void mutate(
                  (it) => isArray(it) && it?.[0] === '/api/workflow/executions/search',
                  (data) => {
                    if (data?.data) {
                      data.data.unshift({
                        status: 'RUNNING',
                      });
                    }
                    event$.emit?.();
                    return data;
                  },
                );
              }
            });
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
      </div>
    </div>
  );
};
