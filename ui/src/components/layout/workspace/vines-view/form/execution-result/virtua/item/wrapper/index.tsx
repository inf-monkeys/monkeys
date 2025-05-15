import React from 'react';

import { useSWRConfig } from 'swr';

import { useMemoizedFn } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isString } from 'lodash';
import { Download, Ellipsis, RotateCcw, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution } from '@/apis/workflow/execution';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
// import { useFlowStore } from '@/store/useFlowStore';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

interface IVirtuaExecutionResultGridWrapperProps {
  data: IVinesExecutionResultItem;
  children: React.ReactNode;
  src?: string;
  event$: EventEmitter<void>;
}

export const VirtuaExecutionResultGridWrapper: React.FC<IVirtuaExecutionResultGridWrapperProps> = ({
  data,
  children,
  src,
  event$,
}) => {
  const { mutate } = useSWRConfig();

  const { vines } = useVinesFlow();

  const { t } = useTranslation();
  // const workflowId = useFlowStore((s) => s.workflowId);
  // const { mutate } = useWorkflowExecutionOutputs(workflowId);
  // 瀑布流
  // 使用直接打开链接方式下载，避免CORS问题
  const handleDownload = useMemoizedFn(() => {
    if (!src) return;

    // 创建一个a标签在新窗口打开图片
    try {
      const link = document.createElement('a');
      link.href = src;
      link.setAttribute('download', '');
      link.setAttribute('target', '_self');
      link.click();

      toast.success(t('common.utils.download.success'));
    } catch (error) {
      console.error('下载异常:', error);
      toast.error(t('common.utils.download.error'));
    }
  });

  const handleDelete = useMemoizedFn(() => {
    const targetInstanceId = data?.instanceId;
    if (targetInstanceId) {
      toast.promise(deleteWorkflowExecution(targetInstanceId), {
        success: () => {
          void mutate(
            (key) => isString(key) && key.startsWith(`/api/workflow/executions/${vines.workflowId}/outputs`),
          ).then(() => {
            event$.emit?.();
          });
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    }
  });

  const handleRetry = useMemoizedFn(() => {
    console.log(data.input);
    const inputData = {};
    for (const { id, data: value } of data.input) {
      inputData[id] = value;
    }
    void mutate(
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
    );
    vines.start({ inputData, onlyStart: true }).then((status) => {
      if (status) {
        toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
        handleDelete();
        event$.emit?.();
      }
    });
  });

  return (
    <div className="group/vgi relative flex h-full flex-1 flex-col">
      {/* 图片内容区域，保持点击可以触发预览 */}
      <div className="z-10 flex-1">{children}</div>

      {/* 操作按钮区域 - 提高z-index确保在最上层可点击 */}
      <div className="absolute right-4 top-4 z-30 flex gap-1 opacity-0 transition-opacity group-hover/vgi:opacity-100">
        {data.status === 'FAILED' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="dark:hover:bg-[--card-dark]/90 rounded bg-white/80 !p-1 shadow-sm hover:bg-white dark:bg-[--card-dark] [&_svg]:!size-3"
                icon={<RotateCcw />}
                variant="outline"
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，防止触发预览
                  handleRetry();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.retry')}</TooltipContent>
          </Tooltip>
        )}

        {src && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="dark:hover:bg-[--card-dark]/90 rounded bg-white/80 !p-1 shadow-sm hover:bg-white dark:bg-[--card-dark] [&_svg]:!size-3"
                icon={<Download />}
                variant="outline"
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，防止触发预览
                  handleDownload();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.download.label')}</TooltipContent>
          </Tooltip>
        )}

        {src && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="dark:hover:bg-[--card-dark]/90 rounded bg-white/80 !p-1 shadow-sm hover:bg-white dark:bg-[--card-dark] [&_svg]:!size-3"
                icon={<Trash />}
                variant="outline"
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，防止触发预览
                  handleDelete();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.delete')}</TooltipContent>
          </Tooltip>
        )}

        <VirtuaExecutionResultRawDataDialog data={data}>
          <Button
            className="dark:hover:bg-[--card-dark]/90 rounded bg-white/80 !p-1 shadow-sm hover:bg-white dark:bg-[--card-dark] [&_svg]:!size-3"
            icon={<Ellipsis />}
            variant="outline"
            size="small"
            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
          />
        </VirtuaExecutionResultRawDataDialog>
      </div>

      {/* hover遮罩 - 半透明，只在hover时显示，z-index设置为20，低于按钮但高于其他元素 */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-lg bg-black/20 opacity-0 transition-opacity group-hover/vgi:opacity-100"></div>
    </div>
  );
};
