import React, { useEffect } from 'react';

import { useMemoizedFn } from 'ahooks';
import { isString } from 'lodash';
import { Download, Ellipsis, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDeleteMediaData } from '@/apis/media-data/index.ts';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

  // 使用直接打开链接方式下载，避免CORS问题
  const handleDownload = useMemoizedFn(() => {
    if (!src) return;

    // 创建一个a标签在新窗口打开图片
    try {
      const link = document.createElement('a');
      link.href = src;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      link.click();

      toast.success(t('common.utils.download.success'));
    } catch (error) {
      console.error('下载异常:', error);
      toast.error(t('common.utils.download.error'));
    }
  });

  // 获取媒体文件ID - 优化提取逻辑
  const getMediaIdFromUrl = (url: string) => {
    if (!url || !isString(url)) return '';

    // 直接从URL路径中提取文件名作为ID
    // 例如：从https://inf-monkeys.oss-cn-beijing.aliyuncs.com/artworks/comfyui/7c1abb8...png
    // 提取7c1abb8...png作为ID
    const parts = url?.split('/');

    const partsLength = parts?.length ?? 0;
    if (!partsLength) return '';

    const filename = parts[parts.length - 1];

    // 去除可能的查询参数
    return filename.split('?')[0];
  };

  // 处理删除 - 添加调试信息和刷新机制
  const { trigger: deleteMedia } = useDeleteMediaData(src ? getMediaIdFromUrl(src) : '');

  const handleDelete = useMemoizedFn(() => {
    if (!src) return;

    const mediaId = getMediaIdFromUrl(src);
    console.log('删除媒体文件:', src);
    console.log('提取的媒体ID:', mediaId);

    if (!mediaId) {
      toast.error(t('common.delete.error'));
      return;
    }

    toast.promise(
      deleteMedia()
        .then((result) => {
          console.log('删除API返回结果:', result);
          // 触发自定义事件通知UI更新
          window.dispatchEvent(new CustomEvent('media-deleted', { detail: { src } }));

          // 强制刷新列表而不是整个页面
          const event = new CustomEvent('refresh-media-list');
          window.dispatchEvent(event);
          return true;
        })
        .catch((error) => {
          console.error('删除API错误:', error);
          throw error;
        }),
      {
        loading: t('common.delete.loading'),
        success: t('common.delete.success'),
        error: t('common.delete.error'),
      },
    );
  });

  // 添加刷新列表的事件监听
  useEffect(() => {
    const handleMediaDeleted = () => {
      console.log('检测到媒体已删除事件');
    };

    window.addEventListener('media-deleted', handleMediaDeleted);
    return () => {
      window.removeEventListener('media-deleted', handleMediaDeleted);
    };
  }, []);

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
