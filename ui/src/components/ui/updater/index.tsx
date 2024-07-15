import React, { useEffect, useState } from 'react';

import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { FileList } from '@/components/ui/updater/file-list.tsx';
import { cn } from '@/utils';

interface IUpdaterProps {
  files?: FileWithPath[]; // 文件列表
  limit?: number; // 文件数量限制
  maxSize?: number; // 文件大小限制 (MB)
  accept?: string[]; // 文件类型限制
  onBeforeUpload?: () => void; // 上传前回调
  onFinished?: (urls: string[]) => void; // 上传完成回调
  onFilesUpdate?: (files: FileWithPath[]) => void; // 文件列表更新回调
  saveToResource?: boolean; // 是否保存到富媒体桶
  basePath?: string;
}

export const Updater: React.FC<IUpdaterProps> = ({
  files: initialFiles = [],
  accept,
  maxSize = 30,
  limit,
  onFinished,
  onBeforeUpload,
  onFilesUpdate,
  saveToResource,
  basePath,
}) => {
  const { t } = useTranslation();

  const [files, setFiles] = useState<FileWithPath[]>(initialFiles);

  const [isInteracted, setIsInteracted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isInteracted && isUploading) {
      onBeforeUpload?.();
    }
  }, [isUploading]);

  useEffect(() => {
    if (initialFiles?.length) {
      setIsInteracted(true);
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  useEffect(() => {
    onFilesUpdate?.(files);
  }, [files]);

  const disabled = isUploading || files.length >= (limit ?? 999);

  return (
    <div className="flex w-full flex-col gap-4">
      <Dropzone
        className={cn((isUploading || disabled) && 'pointer-events-none cursor-not-allowed opacity-60')}
        onDrop={(_files) => {
          setFiles((prev) => [...prev, ..._files]);
          !isInteracted && setIsInteracted(true);
        }}
        accept={accept}
        maxSize={maxSize * 1024 ** 2}
        maxFiles={limit}
        disabled={disabled}
        onReject={(file) => file.forEach((it) => toast.error(`文件 ${it.file.name} 超出限制`))}
      >
        <div className="vines-center h-40 gap-4">
          <FileUp size={50} className="stroke-gold-12" />
          <div className="flex max-w-[70%] flex-col">
            <h1 className="text-lg font-bold leading-tight">
              {t('components.ui.updater.click-or-drag-area', {
                count: limit ?? 2,
              })}
            </h1>
            <p className="text-xs text-opacity-85">
              {accept
                ? t('components.ui.updater.hint.accept.custom', {
                    acceptString: accept.map((it) => `.${it?.split('/')?.[1] ?? it}`).join('、'),
                    count: limit ?? 2,
                  })
                : t('components.ui.updater.hint.accept.any')}
              {t('components.ui.updater.hint.max-size', { maxSize })}
              {limit ? t('components.ui.updater.hint.limit', { limit, count: limit }) : ''}
            </p>
          </div>
        </div>
      </Dropzone>

      {isInteracted && (
        <SmoothTransition className="overflow-hidden">
          <FileList
            files={files}
            setFiles={setFiles}
            limit={limit}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            onFinished={onFinished}
            saveToResource={saveToResource}
            basePath={basePath}
          />
        </SmoothTransition>
      )}
    </div>
  );
};

export const VinesUpdater: React.FC<
  IUpdaterProps & {
    children: React.ReactNode;
  }
> = ({ children, onBeforeUpload, onFinished, limit, ...props }) => {
  const { t } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(val) => !isUploading && setOpen(val)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{t('components.ui.updater.title', { count: limit ?? 2 })}</DialogTitle>
        </DialogHeader>
        <Updater
          onBeforeUpload={() => {
            setIsUploading(true);
            onBeforeUpload?.();
          }}
          onFinished={(urls) => {
            setOpen(false);
            onFinished?.(urls);
            setIsUploading(false);
          }}
          limit={limit}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
};
