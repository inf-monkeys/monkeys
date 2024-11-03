import React, { useRef, useState } from 'react';

import Uppy from '@uppy/core';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import { useClickAway, useCreation, useMemoizedFn, useUnmount } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { ClipboardPaste, FileUp, Plus } from 'lucide-react';
import Dropzone from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { VinesFiles } from '@/components/ui/vines-uploader/files.tsx';
import { useUppyEvent, useUppyState, useVinesDropzone } from '@/components/ui/vines-uploader/hooks.ts';
import FileMd5 from '@/components/ui/vines-uploader/plugin/file-md5.ts';
import RapidUpload from '@/components/ui/vines-uploader/plugin/rapid-upload-with-md5.ts';
import RemoteUrlToFile from '@/components/ui/vines-uploader/plugin/remote-url-to-file.ts';
import { cn } from '@/utils';

export interface IVinesUploaderProps {
  maxSize?: number;

  max?: number;
  min?: number;

  accept?: string[] | null;

  autoUpload?: boolean;
}

export const VinesUploader: React.FC<IVinesUploaderProps> = (props) => {
  const { t } = useTranslation();

  const { maxSize = 30, autoUpload = true, min = 1, max, accept = null } = props;

  const maxFileSize = maxSize * 1024 ** 2;

  const uppy = useCreation(
    () =>
      new Uppy({
        id: 'vines-uppy',
        autoProceed: autoUpload,
        restrictions: { maxFileSize, maxNumberOfFiles: max, minNumberOfFiles: min, allowedFileTypes: accept },
        debug: true,
        logger: {
          debug: console.debug,
          warn: console.warn,
          error: console.error,
        },
      })
        .use(RemoteUrlToFile)
        .use(ThumbnailGenerator, {
          waitForThumbnailsBeforeUpload: true,
          thumbnailType: 'image/png',
          thumbnailHeight: 192,
        })
        .use(FileMd5)
        .use(RapidUpload),
    [],
  );

  useUnmount(() => uppy.destroy());

  useUppyEvent(uppy, 'complete', (result) => {
    console.log('successful files:', result.successful);
    console.log('failed files:', result.failed);
  });

  const filesMapper = useUppyState(uppy, (state) => state.files);

  const handleConvertFile = useMemoizedFn((file: File) => ({
    source: 'VinesUploader',
    name: file.name,
    type: file.type,
    data: file,
    meta: {
      ...((file as any).meta || {}),
      relativePath: (file as any).relativePath || null,
    } as any,
  }));

  const { onDropRejected, validator, onDrag, onPaste } = useVinesDropzone({
    ...props,
    onPasteOrDropCallback: (file) => uppy.addFile(handleConvertFile(file)),
  });

  const ref = useRef<HTMLDivElement>(null);
  const [isClickOutside, setIsClickOutside] = useState(false);

  useClickAway(() => {
    setIsClickOutside(true);
  }, ref);

  const isFilesEmpty = isEmpty(filesMapper);
  const files = Object.values(filesMapper);

  return (
    <Dropzone
      onDrop={(f) => uppy.addFiles(f.map((file) => handleConvertFile(file)))}
      onDropRejected={onDropRejected}
      validator={validator}
      maxSize={maxFileSize}
      maxFiles={max}
      noClick
    >
      {({ getRootProps, getInputProps, isDragAccept, isFocused, open }) => {
        const isEmptyFilesOrDragAccept = isFilesEmpty || isDragAccept;
        return (
          <div
            className={cn('relative h-[15.8rem] rounded')}
            {...getRootProps({
              onPaste: onPaste as any,
              onDrag: onDrag as any,
              ref,
              onClick: () => setIsClickOutside(false),
            })}
          >
            <input {...getInputProps()} />
            {!isFilesEmpty && <VinesFiles uppy={uppy} files={files} />}

            <AnimatePresence>
              {isEmptyFilesOrDragAccept && (
                <motion.div
                  key="vines-uploader-hint"
                  className="absolute left-0 top-0 z-20 size-full p-2 pb-[3.25rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      'vines-center h-full cursor-pointer gap-4 rounded border-2 border-dashed border-input/75 bg-muted/35',
                      isDragAccept && 'border-input bg-muted/75',
                    )}
                    onClick={open}
                  >
                    <FileUp size={50} className="stroke-muted-foreground" />
                    <div className="flex max-w-[70%] flex-col">
                      <h1 className="text-xl font-bold leading-tight text-muted-foreground">
                        {t('components.ui.updater.click-or-drag-area')}
                      </h1>
                      <p className="text-sm text-muted-foreground text-opacity-85">
                        {accept
                          ? t('components.ui.updater.hint.accept.custom', {
                              acceptString: accept.map((it) => `.${it}`).join('、'),
                              count: max,
                            })
                          : t('components.ui.updater.hint.accept.any')}
                        {t('components.ui.updater.hint.max-size', { maxSize })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className={cn(
                'vines-center absolute bottom-0 w-full overflow-hidden rounded-md p-2 backdrop-blur-xl',
                files.length <= 3 && 'pt-0',
              )}
            >
              <Button variant="outline" icon={<Plus />} onClick={open}>
                添加本地文件
              </Button>
              <span
                className={cn(
                  'pointer-events-none absolute bottom-4 right-2.5 flex select-none items-center gap-1 text-sm text-muted-foreground/45 opacity-0 transition-opacity duration-100',
                  isFocused && !isClickOutside && 'opacity-100',
                )}
              >
                <ClipboardPaste className="stroke-muted-foreground/45" size={18} />
                可在此处粘贴图片上传
              </span>
            </div>
          </div>
        );
      }}
    </Dropzone>
  );
};
