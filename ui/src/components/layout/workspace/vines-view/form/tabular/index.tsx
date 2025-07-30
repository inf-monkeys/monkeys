import React, { useState } from 'react';

import { useDebounceFn, useEventEmitter, useMemoizedFn, useThrottleEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isBoolean } from 'lodash';
import { Clipboard, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { cn } from '@/utils';

interface IVinesTabularProps extends React.ComponentPropsWithoutRef<'div'> {
  onWorkflowStart?: () => void;
  isMiniFrame?: boolean;
  event$: EventEmitter<void>;
  height: number;
}

export const VinesTabular: React.FC<IVinesTabularProps> = ({ className, style, event$, height, onWorkflowStart }) => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const { vines } = useVinesFlow();

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

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useMemoizedFn(async (inputData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    event$.emit?.();

    vines
      .start({ inputData, onlyStart: true })
      .then((status) => {
        if (status) {
          if (
            !isBoolean(oem?.theme?.views?.form?.toast?.afterCreate) ||
            oem?.theme?.views?.form?.toast?.afterCreate != false
          )
            toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));

          onWorkflowStart?.();
          event$.emit?.();
        }
      })
      .catch(() => {
        // 执行失败时的处理
      })
      .finally(() => {
        setLoading(false);
        setIsSubmitting(false);
      });
  });

  const { read } = useClipboard({ showSuccess: false });

  event$.useSubscription((event: any) => {
    if (event && event.type && event.type === 'set') {
      tabular$.emit({ type: 'paste-param', data: event.data });
    }
  });

  const handlePasteInput = useMemoizedFn(async () => {
    const text = await read();
    if (text) {
      try {
        const inputData = JSON.parse(text);
        if (inputData.type === 'input-parameters') {
          tabular$.emit({ type: 'paste-param', data: inputData.data });
        } else {
          toast.error(t('workspace.form-view.quick-toolbar.paste-param.bad-content'));
        }
      } catch (error) {
        toast.error(t('workspace.form-view.quick-toolbar.paste-param.bad-content'));
      }
    }
  });

  // 防抖的按钮点击处理
  const debouncedSubmit = useDebounceFn(
    () => {
      tabular$.emit('submit');
    },
    {
      wait: 300, // 300ms 防抖延时
    },
  );

  return (
    <div className={cn('flex flex-col gap-global pr-global', className)} style={style}>
      <div className="flex-1">
        <TabularRender
          formClassName={''}
          inputs={vines.workflowInput}
          isLoading={!vines.workflowLoaded}
          height={height - inputHeight}
          onSubmit={handleSubmit}
          event$={tabular$}
          workflowId={vines.workflowId}
        ></TabularRender>
      </div>
      <div ref={inputRef} className="flex gap-2">
        {isInputNotEmpty && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!px-2.5"
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
                  className="!px-2.5"
                  variant="outline"
                  onClick={() => tabular$.emit('reset')}
                  icon={<RotateCcw />}
                  size="small"
                />
              </TooltipTrigger>
              <TooltipContent>{t('workspace.form-view.quick-toolbar.reset')}</TooltipContent>
            </Tooltip>
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="!px-2.5"
              variant="outline"
              onClick={handlePasteInput}
              icon={<Clipboard />}
              size="small"
            />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.form-view.quick-toolbar.paste-param.label')}</TooltipContent>
        </Tooltip>
        <Button
          variant="solid"
          className="size-full text-base"
          onClick={debouncedSubmit.run}
          size="small"
          disabled={openAIInterfaceEnabled || isSubmitting}
          icon={<Sparkles className="fill-white" />}
          loading={loading}
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
