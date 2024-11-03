import React from 'react';

import Uppy, { Meta, UppyFile } from '@uppy/core';
import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { CircleCheck, Eye, Loader2, Trash2 } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

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

  console.log(list);

  return (
    <motion.div
      className="z-10"
      key="vines-uploader-files"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ScrollArea className="h-52" disabledOverflowMask>
        <div className={cn('flex size-full items-center justify-center gap-2 p-2', listLen > 3 && 'grid grid-cols-3')}>
          {list.map(({ id, preview, src, progress: { uploadComplete, uploadStarted, percentage } }) => (
            <div
              key={id}
              className="vines-center group relative h-48 min-w-40 overflow-hidden rounded border border-input/80 shadow [&_.rc-image-mask]:absolute [&_.rc-image-mask]:h-full [&_.rc-image]:static"
            >
              <Image
                src={preview}
                fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
                preview={{
                  src,
                  icons,
                  closeIcon,
                  mask: <Eye className="stroke-white" />,
                }}
              />
              <div className="absolute left-2 top-2 flex items-center justify-center gap-1 rounded border border-input bg-slate-1 px-2 py-1.5 shadow">
                {uploadComplete ? <CircleCheck size={13} /> : <Loader2 size={13} className="animate-spin" />}
                <p className="text-xs leading-none">
                  {uploadComplete ? '已上传' : uploadStarted ? `上传中（${percentage}%）` : '待上传'}
                </p>
              </div>
              <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
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
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
