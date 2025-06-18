import React, { useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useEventEmitter, useMemoizedFn, useThrottleEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isBoolean, isString } from 'lodash';
import { Clipboard, RotateCcw, Sparkles, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
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

  const { data: oem } = useSystemConfig();

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

  const [loading, setLoading] = useState(false);
  const handleSubmit = useMemoizedFn(async (inputData) => {
    setLoading(true);
    void (await mutate(
      (key) => isString(key) && key.startsWith(`/api/workflow/executions/${vines.workflowId}/outputs`),
      (data: any) => {
        if (data?.data) {
          data.data.unshift({
            status: 'RUNNING',
            output: [{ type: 'image', data: '' }],
            render: { type: 'image', data: '', status: 'RUNNING' },
          });
          if (typeof data?.total === 'number') {
            data.total += 1;
          }
        }
        return data;
      },
      false,
    ));
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
          setHistoryVisible(true);
          setLoading(false);
          event$.emit?.();
        }
      })
      .finally(() => setLoading(false));
  });

  const { read } = useClipboard({ showSuccess: false });

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

  return (
    <div className={cn('flex flex-col pr-4', className)} style={style}>
      <div className="flex-1">
        <TabularRender
          formClassName={''}
          inputs={vines.workflowInput}
          isLoading={!vines.workflowLoaded}
          height={height - inputHeight}
          onSubmit={handleSubmit}
          event$={tabular$}
          workflowId={vines.workflowId}
        >
          <Button ref={submitButton} className="hidden" type="submit" />
        </TabularRender>
      </div>
      <div ref={inputRef} className="flex gap-2">
        {isInputNotEmpty && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!px-2.5"
                  variant="outline"
                  onClick={() => tabular$.emit('restore-previous-param')} // 恢复上一个参数
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
                  onClick={() => tabular$.emit('reset')} // 重置
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
              onClick={handlePasteInput} // 粘贴参数
              icon={<Clipboard />}
              size="small"
            />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.form-view.quick-toolbar.paste-param.label')}</TooltipContent>
        </Tooltip>
        <Button
          variant="solid"
          className="size-full text-base"
          onClick={() => submitButton.current?.click()} // 生成
          size="small"
          disabled={openAIInterfaceEnabled}
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
