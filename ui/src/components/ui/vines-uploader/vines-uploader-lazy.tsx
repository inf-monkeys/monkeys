import React, { useEffect, useRef, useState } from 'react';

import Uppy, { Meta, UppyFile } from '@uppy/core';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import { useClickAway, useCreation, useDrop, useLatest, useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { ClipboardPaste, FileUp, Plus } from 'lucide-react';
import Dropzone from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { VinesFiles } from '@/components/ui/vines-uploader/files.tsx';
import { useUppyEvent, useUppyState, useVinesDropzone } from '@/components/ui/vines-uploader/hooks.ts';
import { IVinesUploaderProps } from '@/components/ui/vines-uploader/index.tsx';
import FileMd5 from '@/components/ui/vines-uploader/plugin/file-md5.ts';
import RapidUpload from '@/components/ui/vines-uploader/plugin/rapid-upload-with-md5.ts';
import RemoteUrlToFile from '@/components/ui/vines-uploader/plugin/remote-url-to-file.ts';
import VinesUpload from '@/components/ui/vines-uploader/plugin/vines-upload.ts';
import { checkIfCorrectURL, getFileNameByOssUrl } from '@/components/ui/vines-uploader/utils.ts';
import { cn } from '@/utils';

const VinesUploader: React.FC<IVinesUploaderProps> = (props) => {
  const { t } = useTranslation();

  const {
    className,
    children,
    uppy$,

    maxSize = 30,
    autoUpload = true,
    min = 1,
    max,
    accept = null,
    onChange,
    basePath,
  } = props;

  const maxFileSize = maxSize * 1024 ** 2;

  const uppy = useCreation(
    () =>
      new Uppy({
        id: 'vines-uppy',
        autoProceed: autoUpload,
        restrictions: { maxFileSize, maxNumberOfFiles: max, minNumberOfFiles: min },
      })
        .use(RemoteUrlToFile)
        .use(ThumbnailGenerator, {
          waitForThumbnailsBeforeUpload: true,
          thumbnailType: 'image/png',
          thumbnailHeight: 192,
        })
        .use(FileMd5)
        .use(RapidUpload)
        .use(VinesUpload, { ...(basePath && { basePath }) }),
    [],
  );

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
    onPasteOrDropCallback: (file) => {
      if (max === 1 && !isEmpty(filesMapper)) {
        const existingFiles = uppy.getFiles();
        existingFiles.forEach(file => uppy.removeFile(file.id));
      }
      uppy.addFile(handleConvertFile(file));
    },
  });

  const ref = useRef<HTMLDivElement>(null);
  const [isClickOutside, setIsClickOutside] = useState(false);

  useClickAway(() => {
    setIsClickOutside(true);
  }, ref);

  const isFilesEmpty = isEmpty(filesMapper);
  const files = Object.values(filesMapper);

  const latestFiles = useLatest(files);
  useUppyEvent(uppy, 'complete', () => {
    onChange?.(latestFiles.current.map((it) => it.uploadURL || it.meta.remoteUrl) as string[], latestFiles.current);
  });
  useUppyEvent(uppy, 'file-removed', (file) => {
    const finalFiles = latestFiles.current.filter((it) => it.id !== file.id);
    onChange?.(finalFiles.map((it) => it.uploadURL || it.meta.remoteUrl) as string[], finalFiles);
  });

  const lastPropFiles = useRef<UppyFile<Meta, Record<string, never>>[]>([]);
  useEffect(() => {
    const currentFileUrls = latestFiles.current.map((it) => it.uploadURL || it.meta.remoteUrl);
    const propsFiles = (props.files || []).filter((it) => !currentFileUrls.includes(it));
    if (propsFiles.length > 0) {
      const convertFiles = propsFiles
        .map((url) => {
          if (checkIfCorrectURL(url)) {
            const file = new File([], getFileNameByOssUrl(url), { type: 'text/plain' }) as File & {
              meta?: { remoteUrl: string };
            };
            file.meta = { remoteUrl: url };
            return handleConvertFile(file);
          }
          return null;
        })
        .filter(Boolean) as any[];

      const needToRemoveFiles = lastPropFiles.current.filter(
        (it) => !propsFiles.some((url) => url === it.meta?.remoteUrl),
      );
      for (const file of needToRemoveFiles) {
        uppy.removeFile(file.id);
      }

      uppy.addFiles(convertFiles);
      lastPropFiles.current = uppy.getFiles();
    }

    uppy$?.emit(uppy);
  }, [props.files, props.originalFiles]);

  const [isHovering, setIsHovering] = useState(false);
  useDrop(ref, {
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
  });

  const filesLength = files.length;

  return (
    <Dropzone
      onDrop={(f) => {
        if (max === 1 && !isEmpty(filesMapper)) {
          const existingFiles = uppy.getFiles();
          existingFiles.forEach(file => uppy.removeFile(file.id));
        }
        uppy.addFiles(f.map((file) => handleConvertFile(file)));
        setIsHovering(false);
      }}
      onDropRejected={onDropRejected}
      validator={validator}
      maxSize={maxFileSize}
      maxFiles={max}
      noClick
    >
      {({ getRootProps, getInputProps, isDragAccept, isDragActive, isFocused, open }) => {
        const isDropzoneActive = isDragAccept || isDragActive || isHovering;
        const isEmptyFilesOrDragAccept = isFilesEmpty || isDropzoneActive;
        return (
          <div
            className={cn('relative h-[15.5rem] rounded dark:bg-card-dark', className)}
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
                  className="absolute left-0 top-0 z-20 size-full p-2 pb-[3rem] dark:bg-card-dark"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className={cn(
                      'vines-center h-full cursor-pointer gap-4 rounded border-2 border-dashed border-input bg-muted/75 dark:bg-[#111113]',
                      isHovering && '!border-solid !bg-muted/75 dark:!bg-[#111113]',
                    )}
                    onClick={open}
                  >
                    <FileUp size={50} className="stroke-muted-foreground" />
                    <div className="flex max-w-[70%] flex-col">
                      <h1 className="text-xl font-bold leading-tight text-muted-foreground">
                        {isHovering
                          ? t('components.ui.updater.release-file')
                          : t('components.ui.updater.click-or-drag-area')}
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
            <span
              className={cn(
                'pointer-events-none absolute -right-2 bottom-4 z-30 flex scale-75 select-none items-center gap-1 text-sm text-muted-foreground/45 opacity-0 transition-opacity duration-100',
                isFocused && !isClickOutside && 'opacity-100',
              )}
            >
              <ClipboardPaste className="stroke-muted-foreground/45" size={18} />
              {t('components.ui.updater.paste-hint')}
            </span>
            <div
              className={cn(
                'vines-center absolute bottom-0 z-20 w-full gap-2 overflow-hidden rounded-md p-2 backdrop-blur-xl dark:bg-[#111113]/80',
                filesLength <= 3 && 'pt-0',
              )}
            >
              <Button
                variant="outline"
                size="small"
                icon={<Plus />}
                onClick={open}
                disabled={filesLength >= (max ?? Infinity)}
              >
                {t('components.ui.updater.add-local-file')}
              </Button>
              {children}
            </div>
          </div>
        );
      }}
    </Dropzone>
  );
};

export default VinesUploader;
