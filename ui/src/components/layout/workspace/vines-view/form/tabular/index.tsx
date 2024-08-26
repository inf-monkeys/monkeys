import React, { useRef } from 'react';

import { useSWRConfig } from 'swr';

import { useEventEmitter } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isArray } from 'lodash';
import { RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import useUrlState from '@/hooks/use-url-state.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesTabularProps extends React.ComponentPropsWithoutRef<'div'> {
  setHistoryVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isMiniFrame?: boolean;
  event$: EventEmitter<void>;
  minimalGap?: boolean;
  workbenchGap?: boolean;
}

export const VinesTabular: React.FC<IVinesTabularProps> = ({
  className,
  style,
  setHistoryVisible,
  event$,
  minimalGap,
  workbenchGap,
}) => {
  const { mutate } = useSWRConfig();
  const { t } = useTranslation();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const containerHeight = usePageStore((s) => s.containerHeight);
  const { vines } = useVinesFlow();

  const submitButton = useRef<HTMLButtonElement>(null);

  const tabular$ = useEventEmitter<TTabularEvent>();

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const isInputNotEmpty = vines.workflowInput.length > 0;

  return (
    <div className={cn('flex flex-col pr-6', className)} style={style}>
      <div className="flex-1">
        <TabularRender
          formClassName={cn(minimalGap && 'gap-0')}
          inputs={vines.workflowInput}
          height={containerHeight - (mode === 'fast' ? 176 : workbenchGap ? 160 : 112)}
          onSubmit={(inputData) => {
            vines.start({ inputData, onlyStart: true }).then((status) => {
              if (status) {
                toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
                setHistoryVisible(true);
                void mutate(
                  (it) => isArray(it) && it?.[0] === '/api/workflow/executions/search',
                  (data: any) => {
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
          event$={tabular$}
        >
          <Button ref={submitButton} className="hidden" type="submit" />
        </TabularRender>
      </div>
      <div className="flex gap-2">
        {isInputNotEmpty && (
          <div className="flex flex-col gap-1">
            <Button
              className="h-auto py-1 text-xs"
              variant="outline"
              onClick={() => tabular$.emit('restore-previous-param')}
              icon={<Undo2 />}
            >
              {t('workspace.form-view.quick-toolbar.restore-previous-param.label')}
            </Button>
            <Button
              className="h-auto py-1 text-xs"
              variant="outline"
              onClick={() => tabular$.emit('reset')}
              icon={<RotateCcw />}
            >
              {t('workspace.form-view.quick-toolbar.reset')}
            </Button>
          </div>
        )}
        <Button
          variant="solid"
          className="size-full"
          onClick={() => submitButton.current?.click()}
          disabled={openAIInterfaceEnabled}
          icon={<Sparkles className="fill-white" />}
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
