import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { FileUp } from 'lucide-react';
import Dropzone, { FileWithPath } from 'react-dropzone';
import { ErrorCode } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { EmbedFileList } from '@/components/ui/uploader/embed-file-list.tsx';
import { FileList } from '@/components/ui/uploader/file-list.tsx';
import { cn } from '@/utils';

export interface IUpdaterProps {
  className?: string;

  files?: FileWithPath[]; // 文件列表
  limit?: number; // 文件数量限制
  maxSize?: number; // 文件大小限制 (MB)

  accept?: string[]; // 文件类型限制
  extensionAccept?: string[]; // 基于扩展名的文件类型限制

  onBeforeUpload?: () => void; // 上传前回调
  onFinished?: (urls: string[]) => void; // 上传完成回调
  onFilesUpdate?: (files: FileWithPath[]) => void; // 文件列表更新回调
  saveToResource?: boolean; // 是否保存到富媒体桶
  basePath?: string;

  mode?: 'simple' | 'embed';
}

export const Uploader: React.FC<IUpdaterProps> = ({
  className,
  files: initialFiles = [],
  accept,
  extensionAccept,
  maxSize = 30,
  limit,
  onFinished,
  onBeforeUpload,
  onFilesUpdate,
  saveToResource,
  basePath,
  mode = 'simple',
}) => {
  const { t } = useTranslation();

  const [files, setFiles] = useState<FileWithPath[]>(initialFiles);

  const [isInteracted, setIsInteracted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [autoUpload, setAutoUpload] = useState(false);

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

  const isSimpleMode = mode === 'simple';
  const isEmbedMode = mode === 'embed';

  const filesLength = files.length;
  const disabledComp = isUploading || filesLength >= (limit ?? 999) || disabled;

  const hasExtensionAccept = extensionAccept?.length;

  return (
    <div className="flex w-full flex-col gap-4">
      <Dropzone
        onDrop={(_files, _, dropEvent) => {
          setFiles((prev) => [...prev, ..._files]);
          !isInteracted && setIsInteracted(true);

          setAutoUpload(dropEvent?.type === 'drop');
        }}
        accept={
          hasExtensionAccept
            ? undefined
            : accept
              ? accept.reduce((acc, mimeType) => {
                  acc[mimeType] = [];
                  return acc;
                }, {})
              : undefined
        }
        maxSize={maxSize * 1024 ** 2}
        maxFiles={limit}
        disabled={disabledComp}
        validator={(file) => {
          const fileName = file?.name ?? '';
          if (/[!@#$%^&*.]{2,}/.test(fileName)) {
            return {
              code: 'filename-invalid',
              message: '',
            };
          }

          const ext = fileName?.split('.')?.pop();
          if (extensionAccept && !extensionAccept?.includes(ext ?? '')) {
            return {
              code: 'file-invalid-type',
              message: '',
            };
          }

          return null;
        }}
        onDropRejected={(file) =>
          file.forEach((it) => {
            it.errors.forEach((err) => {
              if (
                [
                  ErrorCode.FileTooLarge,
                  ErrorCode.FileTooSmall,
                  ErrorCode.TooManyFiles,
                  ErrorCode.FileInvalidType,
                  'filename-invalid',
                ].includes(err.code)
              ) {
                toast.error(
                  t(`components.ui.updater.toast.${err.code}`, {
                    filename: it.file.name,
                  }),
                );
              } else {
                toast.error(
                  t(`components.ui.updater.toast.file-invalid-type`, {
                    filename: it.file.name,
                  }),
                );
              }
            });
          })
        }
      >
        {({ getRootProps, getInputProps }) => {
          return (
            <div
              {...getRootProps()}
              className={cn([
                'group/up relative cursor-pointer rounded border-2 border-dashed border-input',
                isSimpleMode && disabledComp && 'pointer-events-none cursor-not-allowed opacity-60',
                isEmbedMode && filesLength && 'cursor-default border-transparent hover:border-input',
                disabledComp && 'hover:border-transparent',
                className,
              ])}
            >
              <div className="vines-center min-h-40 flex-col overflow-hidden">
                <input {...getInputProps()} />

                <AnimatePresence mode="popLayout">
                  {(isEmbedMode ? !filesLength : true) ? (
                    <motion.div
                      key="vines-uploader-hint"
                      className="absolute flex items-center justify-center gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileUp size={50} className="stroke-gold-12" />
                      <div className="flex max-w-[70%] flex-col">
                        <h1 className="text-lg font-bold leading-tight">
                          {t('components.ui.updater.click-or-drag-area', {
                            count: limit ?? 2,
                          })}
                        </h1>
                        <p className="text-xs text-opacity-85">
                          {hasExtensionAccept
                            ? t('components.ui.updater.hint.accept.custom', {
                                acceptString: extensionAccept.map((it) => `.${it}`).join('、'),
                                count: limit ?? 2,
                              })
                            : hasExtensionAccept && accept
                              ? t('components.ui.updater.hint.accept.custom', {
                                  acceptString: accept.map((it) => `.${it?.split('/')?.[1] ?? it}`).join('、'),
                                  count: limit ?? 2,
                                })
                              : t('components.ui.updater.hint.accept.any')}
                          {t('components.ui.updater.hint.max-size', { maxSize })}
                          {limit ? t('components.ui.updater.hint.limit', { limit, count: limit }) : ''}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <EmbedFileList
                      files={files}
                      setFiles={setFiles}
                      onVisibleChange={setDisabled}
                      limit={limit}
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                      onFinished={onFinished}
                      saveToResource={saveToResource}
                      basePath={basePath}

                      autoUpload={autoUpload}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        }}
      </Dropzone>

      {isInteracted && isSimpleMode && (
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
            autoUpload={autoUpload}
          />
        </SmoothTransition>
      )}
    </div>
  );
};

export const VinesUploader: React.FC<
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
        <Uploader
          className="border-input"
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
          mode="embed"
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
};
