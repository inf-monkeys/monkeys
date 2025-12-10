import React from 'react';

import Uppy, { Meta, UppyFile } from '@uppy/core';
import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { CircleCheck, CircleX, Eye, Loader2, RotateCw, Trash2 } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { UniImagePreviewWrapper } from '@/components/layout-wrapper/main/uni-image-preview';
import { Button } from '@/components/ui/button';
import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
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

  const list = useCreation(
    () =>
      files.map((it) => {
        return {
          ...it,
          src: URL.createObjectURL(it.data) || it.uploadURL || it.preview,
        };
      }) as (UppyFile<Meta, Record<string, never>> & { src: string })[],
    [files],
  );

  const listLen = list.length;

  const { data: oem } = useSystemConfig();

  const isUniImagePreview = oem?.theme.uniImagePreview ?? false;
  const showStatusText = oem?.theme.uploader.statusText ?? true;

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
              uploadURL,
              progress: { uploadComplete, uploadStarted, percentage },
              isRemote,
              error,
              meta,
            }) => {
              const originalSrc =
                (meta.originUrl as string | undefined) || (meta.remoteUrl as string | undefined) || uploadURL || src;
              const thumbSrc = preview || src || originalSrc;
              const isError = error && !isRemote;
              const isUploadComplete = uploadComplete || isRemote;
              return (
                <div
                  key={id}
                  className="vines-center group relative h-48 min-w-28 overflow-hidden dark:bg-card-dark [&_.rc-image-mask]:absolute [&_.rc-image-mask]:z-[1] [&_.rc-image-mask]:h-full [&_.rc-image]:static"
                >
                  {isUniImagePreview ? (
                    <UniImagePreviewWrapper imageUrl={originalSrc}>
                      <img src={thumbSrc} alt={name} className="max-h-full max-w-full object-contain" />
                    </UniImagePreviewWrapper>
                  ) : (
                    <Image
                      src={thumbSrc}
                      fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
                      className="max-h-full max-w-full border-0 object-contain [&_img]:max-h-full [&_img]:max-w-full [&_img]:object-contain"
                      style={{ border: 'none', width: '100%', height: '100%' }}
                      preview={{
                        src: originalSrc,
                        icons,
                        closeIcon,
                        mask: <Eye className="stroke-white" />,
                      }}
                    />
                  )}
                  <div className="absolute left-2 top-2 z-30 flex items-center justify-center gap-1 rounded border border-input bg-slate-1 px-2 py-1.5 shadow dark:bg-card-dark">
                    {isError ? (
                      <CircleX size={13} />
                    ) : isUploadComplete ? (
                      <CircleCheck size={13} />
                    ) : (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    {showStatusText && (
                      <p className="text-xs leading-none">
                        {isError
                          ? t('components.ui.updater.status.upload-failed')
                          : isUploadComplete
                            ? t('components.ui.updater.status.upload-success')
                            : uploadStarted
                              ? t('components.ui.updater.status.uploading', { percentage })
                              : t('components.ui.updater.status.wait')}
                      </p>
                    )}
                    {/* 隐藏秒传提示标识 */}
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
                    <>
                      {/* 删除按钮 - 右上角 */}
                      <div className="pointer-events-none absolute right-2 top-2 z-30 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
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
                      {/* 文件名 - 底部居中（在按钮上方） */}
                      {/* <div className="pointer-events-none absolute bottom-16 z-10 flex w-full items-center justify-center px-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="line-clamp-1 max-w-36 rounded border border-input bg-slate-1 p-1 text-sm leading-none shadow dark:bg-card-dark">
                              {(meta as any)?.originalName || name}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>{(meta as any)?.originalName || name}</TooltipContent>
                        </Tooltip>
                      </div> */}
                    </>
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
