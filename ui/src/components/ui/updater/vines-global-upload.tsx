import React, { useEffect, useRef, useState } from 'react';

import { FileWithPath } from '@mantine/dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { set } from 'lodash';
import { CheckCircle2, FileClock, FileSearch, FileX2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createMediaFile, getResourceByMd5 } from '@/apis/resources';
import { VinesResourceImageParams, VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { Card } from '@/components/ui/card.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IFile } from '@/components/ui/updater/file-list.tsx';
import {
  calculateMD5,
  coverFileSize,
  escapeFileName,
  generateUploadFilePrefix,
  getImageSize,
  uploadFile,
} from '@/components/ui/updater/utils.ts';
import VinesEvent from '@/utils/events.ts';

interface IVinesGlobalUploadProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesGlobalUpload: React.FC<IVinesGlobalUploadProps> = () => {
  const { t } = useTranslation();

  const [list, setList] = useState<IFile[]>([]);
  const [hiddenList, setHiddenList] = useState<string[]>([]);

  const fileMd5 = useRef(new Map<string, string>());
  const [md5Queue, setMd5Queue] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onFinishRef = useRef<(urls: string[]) => void>();

  const updateListById = (id: string, data: Partial<IFile>) => {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
  };

  const isBusyRef = useRef(false);
  const handleCalcMd5 = async () => {
    const fileId = md5Queue[0];
    const it = list.find((it) => it.id === fileId);

    if (!fileId || !it || isBusyRef.current) return;
    isBusyRef.current = true;

    it.status = 'busy';
    const md5 = (await calculateMD5(it.file, (process) => {
      it.progress = process.toFixed(2);
      updateListById(fileId, it);
    })) as string;
    if (!md5) {
      it.status = 'error';
      updateListById(fileId, it);
      isBusyRef.current = false;
      return;
    }
    set(it, 'md5', md5);
    it.status = 'wait-to-update';
    updateListById(fileId, it);
    fileMd5.current.set(it.path, md5);

    isBusyRef.current = false;
    setMd5Queue((prev) => prev.filter((it) => it !== fileId));
  };

  useEffect(() => {
    void handleCalcMd5();

    if (!md5Queue.length && list.length) {
      setIsUploading(true);
      setUploadQueue(finalLists.map((it) => it.id));
      setList((prev) => prev.map((it) => ({ ...it, progress: '0' })));
    }
  }, [md5Queue]);

  useEffect(() => {
    const upload = (files: FileWithPath[], onFinish?: (urls: string[]) => void) => {
      setMd5Queue([]);
      isBusyRef.current = false;
      onFinishRef.current = void 0;

      if (onFinish) {
        onFinishRef.current = onFinish;
      }

      setList(
        files
          .map((it) => {
            const path = it.path;
            if (!path || list.some((item) => item.path === path)) return null;
            const fileId = generateUploadFilePrefix();
            !fileMd5.current.has(path) && setMd5Queue((prev) => [...prev, fileId]);
            return {
              id: fileId,
              file: it,
              path: path,
              name: it.name,
              type: it.type,
              size: it.size,
              status: 'wait',
              progress: '0',
            };
          })
          .filter((it) => it !== null) as IFile[],
      );
      setHiddenList(list.filter((it) => !files.some((file) => file.path === it.path)).map((it) => it.id));
    };

    VinesEvent.on('vines-updater', upload);
    return () => {
      VinesEvent.off('vines-updater', upload);
    };
  }, []);

  const isUploadBusyRef = useRef(false);
  const handleUpload = async () => {
    const fileId = uploadQueue[0];
    const it = list.find((it) => it.id === fileId);

    if (!fileId || !it) return;
    isUploadBusyRef.current = true;
    it.status = 'uploading';
    updateListById(fileId, it);

    const existingFileUrl = (await getResourceByMd5(it.md5 as string))?.data?.url;
    let ossUrl: string = '';
    if (existingFileUrl) {
      ossUrl = existingFileUrl;
      it.progress = '100';
    }

    if (!ossUrl) {
      const file = it.file;
      const fileNameArray = file.name.split('.');
      const fileNameWithoutSuffix = fileNameArray.length > 1 ? fileNameArray.slice(0, -1).join('.') : fileNameArray[0];
      const suffix = fileNameArray.length > 1 ? fileNameArray.pop() : null;
      const filename = `workflow/${it.id}_${escapeFileName(fileNameWithoutSuffix)}${suffix ? '.'.concat(suffix) : ''}`;

      it.status = 'busy';
      updateListById(fileId, it);
      ossUrl = await uploadFile(file, filename, (progress) => {
        it.progress = progress.toFixed(2);
        updateListById(fileId, it);
      });

      let params: VinesResourceImageParams | undefined = void 0;
      if (file.type.startsWith('image')) {
        params = await getImageSize(ossUrl);
      }
      await createMediaFile({
        type: file.type as VinesResourceType,
        md5: it.md5,
        displayName: file.name,
        source: VinesResourceSource.UPLOAD,
        url: ossUrl,
        tags: [],
        categoryIds: [],
        size: file.size,
        params,
      });
    }

    it.url = ossUrl;
    it.status = 'success';
    updateListById(fileId, it);
    isUploadBusyRef.current = false;
    setUploadQueue((prev) => prev.filter((it) => it !== fileId));
  };

  useEffect(() => {
    if (isUploadBusyRef.current) return;
    if (uploadQueue.length) {
      void handleUpload();
    } else if (isUploading) {
      setMd5Queue([]);
      isBusyRef.current = false;
      setList([]);
      setHiddenList([]);
      setIsUploading(false);

      toast.success('上传完毕！');
      setTimeout(() => {
        onFinishRef.current?.(finalLists.map((it) => it?.url ?? '').filter((it) => it));
        setTimeout(() => {
          onFinishRef.current = void 0;
        }, 80);
      }, 200);
    }
  }, [uploadQueue]);

  const finalLists = list.filter((it) => !hiddenList.includes(it.id));
  const filesCount = finalLists.length;
  const totalProgress = finalLists.reduce((prev, curr) => prev + Number(curr.progress), 0) / filesCount;

  return (
    <AnimatePresence>
      {filesCount && (
        <motion.div
          className="absolute right-2 top-2 z-[100000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="w-56 space-y-2 p-4">
            <h1 className="text-sm font-bold">
              {t('components.ui.updater.file-list.status.status.hint', {
                operate: finalLists.some((it) => it.status === 'uploading')
                  ? t('components.ui.updater.file-list.status.status.upload')
                  : t('components.ui.updater.file-list.status.status.calculate'),
              })}
            </h1>
            <Progress value={totalProgress} />
            <Separator />
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">共计 {filesCount} 份文件等待上传</span>
            </div>
            <ScrollArea className="max-h-12">
              <div className="space-y-1">
                {finalLists.map(({ id, name, size, status, md5, progress }) => {
                  return (
                    <Tooltip key={id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          {status === 'wait' && <FileSearch size={16} />}
                          {status === 'busy' ? `${progress}%` : ''}
                          {status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                          {status === 'wait-to-update' && <FileClock size={16} />}
                          {status === 'success' && <CheckCircle2 size={16} />}
                          {status === 'error' && <FileX2 size={16} />}
                          <p className="line-clamp-1 w-40 break-keep">{name}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t('components.ui.updater.file-list.info-tooltip.name') + name}
                        <br />
                        {t('components.ui.updater.file-list.info-tooltip.md5.index') +
                          (!progress
                            ? t('components.ui.updater.file-list.info-tooltip.md5.waiting')
                            : md5 ?? t('components.ui.updater.file-list.info-tooltip.md5.in-progress', { progress }))}
                        <br />
                        {t('components.ui.updater.file-list.info-table.columns.size')}: {coverFileSize(size)}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
