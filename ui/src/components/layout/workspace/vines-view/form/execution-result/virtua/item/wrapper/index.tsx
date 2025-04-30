import React from 'react';

import { useMemoizedFn } from 'ahooks';
import { Download, Ellipsis, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution, useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFlowStore } from '@/store/useFlowStore';

interface IVirtuaExecutionResultGridWrapperProps {
  data: IVinesExecutionResultItem;
  children: React.ReactNode;
  src?: string;
}

export const VirtuaExecutionResultGridWrapper: React.FC<IVirtuaExecutionResultGridWrapperProps> = ({
  data,
  children,
  src,
}) => {
  const { t } = useTranslation();
  const workflowId = useFlowStore((s) => s.workflowId);
  // const { mutate } = useWorkflowExecutionOutputs(workflowId);

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
          // 直接移除本地 outputs 数据
          // void mutate((currentData) => {
          //   if (!currentData) return currentData;
          //   return {
          //     ...currentData,
          //     data: currentData.data.filter((it) => it?.instanceId !== targetInstanceId),
          //   };
          // }, false); // 只更新本地缓存
          return t('common.delete.success');
        },
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      });
    }
  });

  return (
    <div className="group/vgi relative flex h-full min-w-[200px] flex-1 flex-col p-1">
      {/* 图片内容区域，保持点击可以触发预览 */}
      <div className="z-10 flex-1">{children}</div>

      {/* 操作按钮区域 - 提高z-index确保在最上层可点击 */}
      <div className="absolute right-4 top-4 z-30 flex gap-1 opacity-0 transition-opacity group-hover/vgi:opacity-100">
        {src && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded bg-white/80 !p-1 shadow-sm hover:bg-white [&_svg]:!size-3"
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
                className="rounded bg-white/80 !p-1 shadow-sm hover:bg-white [&_svg]:!size-3"
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
            className="rounded bg-white/80 !p-1 shadow-sm hover:bg-white [&_svg]:!size-3"
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
