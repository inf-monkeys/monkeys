import React, { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useDebounceFn, useEventEmitter, useMemoizedFn, useThrottleEffect } from 'ahooks';
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

  // 超时清理假数据的引用
  const cleanupTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // 组件卸载时清理所有超时器
  useEffect(() => {
    return () => {
      cleanupTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      cleanupTimeouts.current.clear();
    };
  }, []);

  const handleSubmit = useMemoizedFn(async (inputData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    // 生成临时 instanceId 用于标识假数据
    const tempInstanceId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    void (await mutate(
      (key) => isString(key) && key.startsWith(`/api/workflow/executions/${vines.workflowId}/outputs`),
      (data: any) => {
        if (data?.data) {
          data.data.unshift({
            status: 'RUNNING',
            instanceId: tempInstanceId, // 添加临时 instanceId
            workflowId: vines.workflowId,
            startTime: Date.now(),
            createTime: Date.now(),
            updateTime: Date.now(),
            endTime: 0,
            taskId: '',
            userId: '',
            teamId: '',
            input: [],
            rawOutput: {},
            output: [{ type: 'image', data: '', key: 'temp' }],
          });
          if (typeof data?.total === 'number') {
            data.total += 1;
          }
        }
        return data;
      },
      false,
    ));

    // 设置30秒超时清理假数据
    const cleanupTimeout = setTimeout(() => {
      mutate(
        (key) => isString(key) && key.startsWith(`/api/workflow/executions/${vines.workflowId}/outputs`),
        (data: any) => {
          if (data?.data) {
            // 移除对应的临时数据
            data.data = data.data.filter((item: any) => item.instanceId !== tempInstanceId);
            if (typeof data?.total === 'number' && data.total > 0) {
              data.total -= 1;
            }
          }
          return data;
        },
        false,
      );
      // 从超时器集合中移除
      cleanupTimeouts.current.delete(cleanupTimeout);
    }, 30000); // 30秒超时

    // 添加到超时器集合
    cleanupTimeouts.current.add(cleanupTimeout);

    event$.emit?.();

    vines
      .start({ inputData, onlyStart: true })
      .then((status) => {
        if (status) {
          // 成功时清理对应的超时器，因为真实数据会替换假数据
          clearTimeout(cleanupTimeout);
          cleanupTimeouts.current.delete(cleanupTimeout);

          if (
            !isBoolean(oem?.theme?.views?.form?.toast?.afterCreate) ||
            oem?.theme?.views?.form?.toast?.afterCreate != false
          )
            toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
          setHistoryVisible(true);
          event$.emit?.();
        }
      })
      .catch(() => {
        // 失败时立即清理假数据，不等超时
        clearTimeout(cleanupTimeout);
        cleanupTimeouts.current.delete(cleanupTimeout);

        mutate(
          (key) => isString(key) && key.startsWith(`/api/workflow/executions/${vines.workflowId}/outputs`),
          (data: any) => {
            if (data?.data) {
              data.data = data.data.filter((item: any) => item.instanceId !== tempInstanceId);
              if (typeof data?.total === 'number' && data.total > 0) {
                data.total -= 1;
              }
            }
            return data;
          },
          false,
        );
      })
      .finally(() => {
        setLoading(false);
        setIsSubmitting(false);
      });
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
