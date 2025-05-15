import React from 'react';

import Uppy, { Meta, UppyFile } from '@uppy/core';
import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { CircleCheck, CircleX, Eye, Loader2, RotateCw, Trash2, Zap } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

interface IVinesFilesProps {
  uppy: Uppy<Meta, Record<string, never>>;
  files: UppyFile<Meta, Record<string, never>>[];
}

export const VinesFiles: React.FC<IVinesFilesProps> = ({ uppy, files }) => {
  const { t } = useTranslation();

  const { icons, closeIcon } = useVinesImageManage();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);
  const isDarkMode = mode === 'dark';

  const list = useCreation(() => {
    console.log('VinesFiles: 处理文件列表, files =', files);
    return files.map((it) => {
      // 检查是否有remoteUrl（原始输入图片）
      const isOriginal = it.meta?.isOriginal;
      const remoteUrl = it.meta?.remoteUrl as string | undefined;

      console.log('VinesFiles: 处理文件:', {
        id: it.id,
        name: it.name,
        isOriginal,
        remoteUrl,
        data: it.data ? '有数据' : '无数据',
        uploadURL: it.uploadURL,
        preview: it.preview,
      });

      let src: string | undefined;

      // 优先级：1. 原始输入图片URL 2. Blob数据 3. 上传URL 4. 预览URL
      if (remoteUrl) {
        // 如果有remoteUrl，优先使用它
        src = remoteUrl;
        console.log('VinesFiles: 使用remoteUrl:', src);

        // 确保URL是有效的
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
          console.warn('VinesFiles: URL格式可能不正确，尝试添加协议:', src);
          src = 'https://' + src;
        }
      } else if (it.data instanceof Blob) {
        // 如果有Blob数据，创建对象URL
        src = URL.createObjectURL(it.data);
        console.log('VinesFiles: 创建Blob对象URL:', src);
      } else if (it.uploadURL) {
        // 使用上传URL
        src = it.uploadURL;
        console.log('VinesFiles: 使用上传URL:', src);
      } else if (it.preview) {
        // 使用预览URL
        src = it.preview;
        console.log('VinesFiles: 使用预览URL:', src);
      } else {
        // 没有可用的URL
        console.warn('VinesFiles: 没有可用的图片URL');
        src = isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp';
      }

      return {
        ...it,
        src,
      };
    }) as (UppyFile<Meta, Record<string, never>> & { src: string })[];
  }, [files, isDarkMode]);

  const listLen = list.length;

  return (
    <motion.div
      className="z-10 dark:bg-card-dark"
      key="vines-uploader-files"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ScrollArea className="h-52 dark:bg-card-dark" disabledOverflowMask>
        <div className={cn('flex size-full items-center justify-center gap-2 p-2', listLen > 3 && 'grid grid-cols-3')}>
          {list.map(
            ({
              id,
              preview,
              name,
              src,
              progress: { uploadComplete, uploadStarted, percentage },
              isRemote,
              error,
              meta,
            }) => {
              const isError = error && !isRemote;
              const isUploadComplete = uploadComplete || isRemote;
              return (
                <div
                  key={id}
                  className="vines-center group relative h-48 min-w-28 overflow-hidden dark:bg-card-dark [&_.rc-image-mask]:absolute [&_.rc-image-mask]:h-full [&_.rc-image]:static"
                >
                  <Image
                    src={src || preview}
                    fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
                    className="border-0"
                    style={{ border: 'none' }}
                    preview={{
                      src,
                      icons,
                      closeIcon,
                      mask: <Eye className="stroke-white" />,
                    }}
                    onError={(e) => {
                      console.error('VinesFiles: 图片加载失败:', src || preview);

                      // 尝试修复URL格式
                      if (src && typeof src === 'string') {
                        let fixedSrc = src;

                        // 如果URL不是以http或/开头，尝试添加https://
                        if (!src.startsWith('http') && !src.startsWith('/')) {
                          fixedSrc = 'https://' + src;
                          console.log('VinesFiles: 尝试修复URL格式:', fixedSrc);

                          // 尝试使用修复后的URL
                          e.currentTarget.src = fixedSrc;
                          return;
                        }

                        // 如果是相对URL，尝试添加域名
                        if (src.startsWith('/')) {
                          fixedSrc = window.location.origin + src;
                          console.log('VinesFiles: 尝试添加域名:', fixedSrc);

                          // 尝试使用修复后的URL
                          e.currentTarget.src = fixedSrc;
                          return;
                        }
                      }

                      // 如果修复失败，使用fallback
                      e.currentTarget.src = isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp';
                    }}
                  />
                  <div className="absolute left-2 top-2 flex items-center justify-center gap-1 rounded border border-input bg-slate-1 px-2 py-1.5 shadow dark:bg-card-dark">
                    {isError ? (
                      <CircleX size={13} />
                    ) : isUploadComplete ? (
                      <CircleCheck size={13} />
                    ) : (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    <p className="text-xs leading-none">
                      {isError
                        ? t('components.ui.updater.status.upload-failed')
                        : isUploadComplete
                          ? t('components.ui.updater.status.upload-success')
                          : uploadStarted
                            ? t('components.ui.updater.status.uploading', { percentage })
                            : t('components.ui.updater.status.wait')}
                    </p>
                    {(meta.isRapidUploaded as boolean) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex cursor-pointer items-center gap-1">
                            <Separator className="mx-1 h-4" orientation="vertical" />
                            <Zap size={13} className="fill-vines-500 stroke-vines-500" />
                            <p className="text-xs leading-none text-vines-500">
                              {t('components.ui.updater.rapid-upload')}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={8}>{t('components.ui.updater.rapid-upload-tip')}</TooltipContent>
                      </Tooltip>
                    )}
                    {isError && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="absolute -right-8 !p-1"
                            icon={<RotateCw size={12} />}
                            variant="outline"
                            size="small"
                            onClick={() => uppy.retryUpload(id)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{t('common.utils.retry')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {!meta.isUploading && (
                    <div className="pointer-events-none absolute bottom-2 flex w-full items-center justify-between gap-2 px-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="line-clamp-1 max-w-36 rounded border border-input bg-slate-1 p-1 text-sm leading-none shadow dark:bg-card-dark">
                            {name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>{name}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="!p-1.5"
                            icon={<Trash2 size={12} />}
                            variant="outline"
                            size="small"
                            onClick={() => uppy.removeFile(id)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{t('common.utils.delete')}</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
