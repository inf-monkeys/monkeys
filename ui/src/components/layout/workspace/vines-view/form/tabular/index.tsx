import React, { useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useEventEmitter, useThrottleEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isArray } from 'lodash';
import { RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import useUrlState from '@/hooks/use-url-state.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { cn } from '@/utils';

interface IVinesTabularProps extends React.ComponentPropsWithoutRef<'div'> {
  setHistoryVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isMiniFrame?: boolean;
  event$: EventEmitter<void>;
  height: number;
}

export const VinesTabular: React.FC<IVinesTabularProps> = ({ className, style, setHistoryVisible, event$, height }) => {
  const { mutate } = useSWRConfig();
  const { t } = useTranslation();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { vines } = useVinesFlow();

  const submitButton = useRef<HTMLButtonElement>(null);

  const tabular$ = useEventEmitter<TTabularEvent>();

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const isInputNotEmpty = vines.workflowInput.length > 0;

  const { ref: inputRef, height: wrapperHeight } = useElementSize();
  const [inputHeight, setInputHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setInputHeight(wrapperHeight + 8);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className={cn('flex flex-col pr-6', className)} style={style}>
      <div className="flex-1">
        <TabularRender
          formClassName={cn(mode === 'mini' && 'gap-0')}
          inputs={vines.workflowInput}
          isLoading={!vines.workflowLoaded}
          height={height - inputHeight}
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
          workflowId={vines.workflowId}
        >
          <Button ref={submitButton} className="hidden" type="submit" />
        </TabularRender>
      </div>
      <div ref={inputRef} className="flex gap-2">
        {isInputNotEmpty && (
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!h-6 py-1 text-xs"
                  variant="outline"
                  onClick={() => tabular$.emit('restore-previous-param')}
                  icon={<Undo2 />}
                  size="small"
                />
              </TooltipTrigger>
              <TooltipContent>{t('workspace.form-view.quick-toolbar.restore-previous-param.label')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!h-6 py-1 text-xs"
                  variant="outline"
                  onClick={() => tabular$.emit('reset')}
                  icon={<RotateCcw />}
                  size="small"
                />
              </TooltipTrigger>
              <TooltipContent> {t('workspace.form-view.quick-toolbar.reset')}</TooltipContent>
            </Tooltip>
          </div>
        )}
        <Button
          variant="solid"
          className="size-full text-base"
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
