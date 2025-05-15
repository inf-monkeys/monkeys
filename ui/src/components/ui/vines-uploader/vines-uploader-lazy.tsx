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
    onPasteOrDropCallback: (file) => uppy.addFile(handleConvertFile(file)),
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
    // 如果有原始输入图片，优先使用它们
    const originalFiles = props.originalFiles || [];
    console.log('VinesUploader-useEffect: props.originalFiles =', originalFiles);
    console.log('VinesUploader-useEffect: props =', props);

    // 如果没有原始输入图片，但有常规文件，也尝试使用它们
    const filesToUse = originalFiles.length > 0 ? originalFiles : props.files || [];

    if (filesToUse.length > 0) {
      console.log('VinesUploader: 使用图片:', filesToUse, '是原始输入图片:', originalFiles.length > 0);

      try {
        // 清除现有文件
        console.log('VinesUploader: 清除现有文件, 当前文件数:', uppy.getFiles().length);
        uppy.getFiles().forEach(file => {
          console.log('VinesUploader: 移除文件:', file.id);
          uppy.removeFile(file.id);
        });

        // 预处理URL，确保它们是有效的
        const validUrls = filesToUse.filter(url => {
          // 简化URL验证，只要是字符串就接受
          if (typeof url !== 'string') {
            console.warn('VinesUploader: 跳过非字符串URL:', url);
            return false;
          }

          // 尝试使用更宽松的验证
          const isValid = url.startsWith('http') || url.startsWith('/') ||
            url.includes('.jpg') || url.includes('.png') ||
            url.includes('/monkeys/');

          if (!isValid) {
            console.warn('VinesUploader: URL格式可能不正确:', url);
          }

          return true; // 即使格式可能不正确，也尝试使用
        });

        if (validUrls.length === 0) {
          console.warn('VinesUploader: 没有有效的图片URL');
          // 如果没有有效URL，尝试使用第一个URL，即使它不符合我们的检查标准
          if (filesToUse.length > 0 && typeof filesToUse[0] === 'string') {
            validUrls.push(filesToUse[0]);
            console.log('VinesUploader: 强制使用第一个URL:', filesToUse[0]);
          }
        }

        const convertFiles = validUrls
          .map((url, index) => {
            console.log(`VinesUploader: 处理URL[${index}]:`, url);
            try {
              // 确保URL格式正确
              let processedUrl = url;
              if (!url.startsWith('http') && !url.startsWith('/')) {
                processedUrl = 'https://' + url;
                console.log('VinesUploader: 修正URL格式:', processedUrl);
              }

              const fileName = getFileNameByOssUrl(processedUrl) || `image_${index}.jpg`;
              console.log('VinesUploader: 文件名:', fileName);

              // 创建一个空文件，但带有元数据
              const file = new File([], fileName, { type: 'text/plain' }) as File & {
                meta?: { remoteUrl: string; isOriginal?: boolean };
              };
              file.meta = {
                remoteUrl: processedUrl,
                isOriginal: true // 始终标记为原始输入图片，确保优先使用remoteUrl
              };

              const convertedFile = handleConvertFile(file);
              console.log('VinesUploader: 转换后的文件:', convertedFile);
              return convertedFile;
            } catch (error) {
              console.error('VinesUploader: 处理URL时出错:', url, error);
              return null;
            }
          })
          .filter(Boolean) as any[];

        console.log('VinesUploader: 转换后的文件数组:', convertFiles);

        // 添加图片
        if (convertFiles.length > 0) {
          console.log('VinesUploader: 添加文件到uppy');
          uppy.addFiles(convertFiles);
          lastPropFiles.current = uppy.getFiles();
          console.log('VinesUploader: 添加后的文件数:', uppy.getFiles().length);

          // 触发onChange回调，确保表单值更新
          if (onChange) {
            console.log('VinesUploader: 触发onChange回调');
            // 使用原始URL而不是可能被修改的URL
            onChange(
              validUrls,
              uppy.getFiles()
            );
          }
        } else {
          console.log('VinesUploader: 没有有效的文件可添加');
        }

        uppy$?.emit(uppy);
      } catch (error) {
        console.error('VinesUploader: 处理图片时出错:', error);
      }
      return;
    }

    // 原有的文件处理逻辑
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
            className={cn('dark:bg-card-dark relative h-[15.5rem] rounded', className)}
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
                  className="dark:bg-card-dark absolute left-0 top-0 z-20 size-full p-2 pb-[3rem]"
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
