import React, { useEffect, useRef, useState } from 'react';

import Uppy, { Meta, UppyFile } from '@uppy/core';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import { useClickAway, useCreation, useDrop, useLatest, useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { get, isEmpty } from 'lodash';
import { Clipboard, Upload } from 'lucide-react';
import { nanoid } from 'nanoid';
import Dropzone from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { VinesFiles } from '@/components/ui/vines-uploader/files.tsx';
import { useUppyEvent, useUppyState, useVinesDropzone } from '@/components/ui/vines-uploader/hooks.ts';
import { IVinesUploaderProps } from '@/components/ui/vines-uploader/index.tsx';
import FileMd5 from '@/components/ui/vines-uploader/plugin/file-md5.ts';
import RapidUpload from '@/components/ui/vines-uploader/plugin/rapid-upload-with-md5.ts';
import RemoteUrlToFile from '@/components/ui/vines-uploader/plugin/remote-url-to-file.ts';
import VinesUpload from '@/components/ui/vines-uploader/plugin/vines-upload.ts';
import { addProtocolToURL, checkIfCorrectURL, getFileNameByOssUrl } from '@/components/ui/vines-uploader/utils.ts';
import { cn } from '@/utils';

import { Button } from '../button';
import { LucideIconGradient } from '../vines-icon/lucide/gradient';

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

  const handleConvertFile = useMemoizedFn((file: File) => {
    const suffix = file.name.split('.').pop()?.toLowerCase();
    const id = nanoid();
    const newName = `${id}.${suffix}`;
    return {
      source: 'VinesUploader',
      name: newName, // 用于存储的文件名（避免冲突）
      type: file.type,
      data: file,
      meta: {
        ...((file as any).meta || {}),
        relativePath: (file as any).relativePath || null,
        originalName: file.name, // 保存原始文件名
      } as any,
    };
  });

  const { onDropRejected, validator, onDrag, onPaste } = useVinesDropzone({
    ...props,
    onPasteOrDropCallback: (file) => {
      if (max === 1 && !isEmpty(filesMapper)) {
        const existingFiles = uppy.getFiles();
        existingFiles.forEach((file) => uppy.removeFile(file.id));
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
  useUppyEvent(uppy, 'upload-success', (file, response) => {
    // 确保 uploadURL 被设置
    if (response.uploadURL && !file.uploadURL) {
      const currentFile = uppy.getFile(file.id);
      if (currentFile) {
        uppy.setFileState(file.id, {
          ...currentFile,
          uploadURL: response.uploadURL,
        });
      }
    }
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

  // 添加自定义拖拽处理状态
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 自定义拖拽处理函数
  const handleCustomDragOver = useMemoizedFn((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 检查是否包含可处理的数据类型
    const hasFiles = e.dataTransfer.types.includes('Files');
    const hasUriList = e.dataTransfer.types.includes('text/uri-list');

    if (hasFiles || hasUriList) {
      setIsDraggingOver(true);
      setIsHovering(true);
    }
  });

  const handleCustomDragLeave = useMemoizedFn((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有当真正离开容器时才取消状态
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingOver(false);
      setIsHovering(false);
    }
  });

  // 处理点击粘贴
  const handlePasteClick = useMemoizedFn(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        // 处理图片文件
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.${type.split('/')[1]}`, {
              type,
            });

            if (max === 1 && !isEmpty(filesMapper)) {
              const existingFiles = uppy.getFiles();
              existingFiles.forEach((existingFile) => uppy.removeFile(existingFile.id));
            }

            uppy.addFile(handleConvertFile(file));
            return;
          }
        }

        // 处理文本内容（可能包含URL）
        if (item.types.includes('text/plain')) {
          const text = await (await item.getType('text/plain')).text();
          const cleanUrl = addProtocolToURL(text.trim());

          if (checkIfCorrectURL(cleanUrl)) {
            try {
              // 尝试获取图片数据
              const response = await fetch(cleanUrl, {
                mode: 'cors',
                credentials: 'omit',
                headers: {
                  Accept: 'image/*,*/*;q=0.9',
                },
              });

              if (response.ok) {
                const blob = await response.blob();
                if (blob.type.startsWith('image/') || blob.size > 0) {
                  const filename = getFileNameByOssUrl(cleanUrl) || `image_${Date.now()}.png`;
                  const file = new File([blob], filename, {
                    type: blob.type || 'image/png',
                  });

                  if (max === 1 && !isEmpty(filesMapper)) {
                    const existingFiles = uppy.getFiles();
                    existingFiles.forEach((existingFile) => uppy.removeFile(existingFile.id));
                  }

                  uppy.addFile(handleConvertFile(file));
                  return;
                }
              }
            } catch (error) {
              // 如果无法作为文件下载，作为远程URL处理
              const file = new File([], getFileNameByOssUrl(cleanUrl), {
                type: 'text/plain',
              }) as File & { meta?: { remoteUrl: string } };
              file.meta = { remoteUrl: cleanUrl };

              if (max === 1 && !isEmpty(filesMapper)) {
                const existingFiles = uppy.getFiles();
                existingFiles.forEach((existingFile) => uppy.removeFile(existingFile.id));
              }

              uppy.addFile(handleConvertFile(file));
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
    }
  });

  const handleCustomDrop = useMemoizedFn(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingOver(false);
    setIsHovering(false);

    // console.log('Drop event triggered');
    // console.log('DataTransfer types:', Array.from(e.dataTransfer.types));
    // console.log('DataTransfer items:', Array.from(e.dataTransfer.items));

    // 处理文件拖拽（标准情况）
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // console.log('Processing files:', e.dataTransfer.files);
      const files = Array.from(e.dataTransfer.files);

      if (max === 1 && !isEmpty(filesMapper)) {
        const existingFiles = uppy.getFiles();
        existingFiles.forEach((file) => uppy.removeFile(file.id));
      }

      uppy.addFiles(files.map((file) => handleConvertFile(file)));
      return;
    }

    // 处理网页图片拖拽
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const items = Array.from(e.dataTransfer.items);
      // console.log('Processing dataTransfer items:', items);

      for (const item of items) {
        // console.log('Item kind:', item.kind, 'type:', item.type);
        // console.log('item', item.type, item);

        if (item.kind === 'string') {
          // 处理各种字符串类型的数据
          if (item.type === 'text/uri-list') {
            item.getAsString(async (data) => {
              // console.log(`Got data:`, data);
              // console.log('item string data', data);
              const url = data;

              // 根据数据类型提取URL
              // if (item.type === 'text/uri-list') {
              //   url = data.trim();
              // } else if (item.type === 'text/plain') {
              //   // 检查是否是URL
              //   url = data.trim();
              // } else if (item.type === 'text/html') {
              //   // 从HTML中提取图片URL
              //   const imgMatch = data.match(/<img[^>]+src=['"]+([^'"]*)['"]/i);
              //   if (imgMatch) {
              //     url = imgMatch[1];
              //   }
              // }

              if (url) {
                // console.log('Extracted URL:', url);
                const cleanUrl = addProtocolToURL(url);

                if (checkIfCorrectURL(cleanUrl)) {
                  try {
                    // console.log('Attempting to fetch:', cleanUrl);

                    // 尝试获取图片数据
                    const response = await fetch(cleanUrl, {
                      mode: 'cors',
                      credentials: 'omit',
                      headers: {
                        Accept: 'image/*,*/*;q=0.9',
                      },
                    });

                    if (response.ok) {
                      const blob = await response.blob();
                      // console.log('Fetched blob:', blob.type, blob.size);

                      if (blob.type.startsWith('image/') || blob.size > 0) {
                        const filename = getFileNameByOssUrl(cleanUrl) || `image_${Date.now()}.png`;
                        const file = new File([blob], filename, {
                          type: blob.type || 'image/png',
                        });

                        file['meta'] = {
                          originUrl: url,
                        };

                        // console.log('Created file:', file.name, file.type, file.size);

                        if (max === 1 && !isEmpty(filesMapper)) {
                          const existingFiles = uppy.getFiles();
                          existingFiles.forEach((existingFile) => uppy.removeFile(existingFile.id));
                        }

                        const convertedFile = handleConvertFile(file);
                        // console.log('Adding file to uppy:', convertedFile);
                        uppy.addFile(convertedFile);

                        return; // 成功处理，退出
                      }
                    }
                  } catch (error) {
                    // console.error('Failed to fetch image:', error);
                    // console.error('Failed url', url);
                  }

                  // 如果无法作为文件下载，作为远程URL处理
                  // console.log('Fallback: treating as remote URL');
                  const file = new File([], getFileNameByOssUrl(cleanUrl), {
                    type: 'text/plain',
                  }) as File & { meta?: { remoteUrl: string } };
                  file.meta = { remoteUrl: cleanUrl };

                  if (max === 1 && !isEmpty(filesMapper)) {
                    const existingFiles = uppy.getFiles();
                    existingFiles.forEach((existingFile) => uppy.removeFile(existingFile.id));
                  }

                  const convertedFile = handleConvertFile(file);
                  // console.log('Adding remote URL file to uppy:', convertedFile);
                  uppy.addFile(convertedFile);
                }
              }
            });
          }
        }
      }
    }
  });

  const { data: systemConfig } = useSystemConfig();
  const themeGradient = get(systemConfig, 'theme.gradient', undefined) as ISystemConfig['theme']['gradient'];
  const uploaderOrientation = get(
    systemConfig,
    'theme.uploader.orientation',
    'horizontal',
  ) as ISystemConfig['theme']['uploader']['orientation'];
  const uploaderPasteButton = get(
    systemConfig,
    'theme.uploader.pasteButton',
    true,
  ) as ISystemConfig['theme']['uploader']['pasteButton'];

  return (
    <Dropzone
      onDrop={(files, _rejected, event) => {
        // 这里只处理react-dropzone能识别的文件拖拽
        // console.log('React-dropzone onDrop:', files);
        console.log(event);
        if (files.length > 0) {
          if (max === 1 && !isEmpty(filesMapper)) {
            const existingFiles = uppy.getFiles();
            existingFiles.forEach((file) => uppy.removeFile(file.id));
          }
          uppy.addFiles(files.map((file) => handleConvertFile(file)));
        }
        setIsHovering(false);
      }}
      onDropRejected={onDropRejected}
      validator={validator}
      maxSize={maxFileSize}
      maxFiles={max}
      noClick
      // 禁用react-dropzone的默认拖拽处理
      preventDropOnDocument={false}
    >
      {({ getRootProps, getInputProps, isDragAccept, isDragActive, isFocused, open }) => {
        const isDropzoneActive = isDragAccept || isDragActive || isHovering || isDraggingOver;
        const isEmptyFilesOrDragAccept = isFilesEmpty || isDropzoneActive;

        return (
          <div
            className={cn('relative h-[12rem] rounded dark:bg-card-dark', className)}
            {...getRootProps({
              onPaste: onPaste as any,
              ref,
              onClick: () => setIsClickOutside(false),
            })}
            // 覆盖react-dropzone的拖拽事件处理
            // onDragOver={handleCustomDragOver}
            // onDragLeave={handleCustomDragLeave}
            onDrop={handleCustomDrop}
          >
            <input {...getInputProps()} />
            {!isFilesEmpty && <VinesFiles uppy={uppy} files={files} />}

            <AnimatePresence>
              {isEmptyFilesOrDragAccept && (
                <motion.div
                  key="vines-uploader-hint"
                  className="absolute left-0 top-0 z-20 size-full p-2 dark:bg-card-dark"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className={cn(
                      'vines-center h-full cursor-pointer gap-global rounded border-2 border-dashed border-input bg-muted/75 dark:bg-[#111113]',
                      uploaderOrientation === 'vertical' && 'flex-col',
                      uploaderOrientation === 'horizontal' && 'flex-row',
                      isHovering && '!border-solid !bg-muted/75 dark:!bg-[#111113]',
                    )}
                    onClick={open}
                  >
                    <LucideIconGradient icon={Upload} size={uploaderOrientation === 'horizontal' ? 50 : 25} />
                    <div className="flex max-w-[80%] flex-col gap-1 text-center">
                      <h1
                        className={cn(
                          'text-xl font-bold',
                          uploaderOrientation === 'vertical' && 'text-md',
                          themeGradient ? 'bg-gradient bg-clip-text text-gradient' : 'text-muted-foreground',
                        )}
                      >
                        {isHovering
                          ? t('components.ui.updater.release-file')
                          : t('components.ui.updater.click-or-drag-area')}
                      </h1>
                      <p className="break-words text-xs text-muted-foreground text-opacity-85">
                        {accept
                          ? t('components.ui.updater.hint.accept.custom', {
                              acceptString: accept.map((it) => `.${it}`).join('、'),
                              count: max,
                            })
                          : t('components.ui.updater.hint.accept.any')}{' '}
                        {t('components.ui.updater.hint.max-size', { maxSize })}
                      </p>
                      {uploaderOrientation === 'horizontal' && (
                        <p className="text-xs text-muted-foreground text-opacity-85">
                          {t('components.ui.updater.paste-hint')}
                        </p>
                      )}
                      {uploaderPasteButton && (
                        <Button
                          variant="outline"
                          size="small"
                          icon={<Clipboard />}
                          onClick={handlePasteClick}
                          disabled={filesLength >= (max ?? Infinity)}
                        >
                          {t('components.ui.updater.hint.paste-from-clipboard')}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className={cn(
                'vines-center absolute bottom-0 z-20 w-full gap-2 overflow-hidden rounded-md',
                filesLength <= 3 && 'pt-0',
              )}
            >
              {/* <Button
                variant="outline"
                size="small"
                icon={<Plus />}
                onClick={open}
                disabled={filesLength >= (max ?? Infinity)}
              >
                {t('components.ui.updater.add-local-file')}
              </Button> */}
              {children}
            </div>
          </div>
        );
      }}
    </Dropzone>
  );
};

export default VinesUploader;
