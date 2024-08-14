import React, { useEffect, useRef, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createMediaFile, getResourceByMd5 } from '@/apis/resources';
import { VinesResourceImageParams, VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { IFile } from '@/components/ui/uploader/file-list.tsx';
import { calculateMD5, generateUploadFilePrefix, getImageSize, uploadFile } from '@/components/ui/uploader/utils.ts';

interface IUseVinesUploaderManage {
  files: FileWithPath[];

  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;

  basePath: string;
  saveToResource?: boolean;

  onFinished?: (urls: string[]) => void;

  list: IFile[];
  setList: React.Dispatch<React.SetStateAction<IFile[]>>;
}

export const useVinesUploaderManage = ({
  files,
  list,
  setList,
  isUploading,
  setIsUploading,
  onFinished,
  saveToResource = true,
  basePath = 'user-files/other',
}: IUseVinesUploaderManage) => {
  const { t } = useTranslation();

  const [hiddenList, setHiddenList] = useState<string[]>([]);

  const fileMd5 = useRef(new Map<string, string>());
  const [md5Queue, setMd5Queue] = useState<string[]>([]);

  // region 初步处理
  useEffect(() => {
    const newList: IFile[] = files
      .map((it) => {
        const path = it.path;
        if (!path || list.some((item) => item.path === path)) return null;
        const fileId = generateUploadFilePrefix();

        const isUpdated = /(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(path);

        if (!fileMd5.current.has(path) && !isUpdated) {
          setMd5Queue((prev) => [...prev, fileId]);
        }
        return {
          id: fileId,
          file: it,
          path,
          name: it.name,
          type: it.type,
          size: it.size,
          status: isUpdated ? 'success' : 'wait',
          progress: '0',
          ...(isUpdated ? { url: path } : {}),
        };
      })
      .filter((it) => it !== null) as IFile[];
    setList((prev) => [...prev, ...newList]);
    setHiddenList(list.filter((it) => !files.some((file) => file.path === it.path)).map((it) => it.id));
  }, [files]);
  // endregion

  const updateListById = useMemoizedFn((id: string, data: Partial<IFile>) => {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, ...data } : it)));
  });

  // region 计算 MD5
  const isBusyRef = useRef(false);
  const handleCalcMd5 = useMemoizedFn(async () => {
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
  });

  useEffect(() => {
    void handleCalcMd5();
  }, [md5Queue]);
  // endregion

  const validList = list.filter((it) => !hiddenList.includes(it.id));
  const hasFile = validList.length > 0;

  // region 上传文件
  const isWaitToUpload =
    hasFile && validList.filter((it) => it.status !== 'success').every((it) => it.status === 'wait-to-update');

  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const handleOnClickUpload = useMemoizedFn(async () => {
    if (!isWaitToUpload) return;
    const filteredList = validList.filter((it) => !/(https|http):\/\/[^\s/]+\.[^\s/]+\/\S+\.\w{2,5}/g.test(it.path));
    if (!filteredList.length) {
      toast.error(t('components.ui.updater.file-list.toast.no-file'));
      return;
    }
    setIsUploading(true);
    setUploadQueue(filteredList.map((it) => it.id));
    setList((prev) => prev.map((it) => ({ ...it, progress: '0' })));
  });

  const isUploadBusyRef = useRef(false);
  const handleUpload = useMemoizedFn(async () => {
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

      const filename = `${basePath}/${it.id}_${fileNameWithoutSuffix}${suffix ? '.'.concat(suffix) : ''}`;

      it.status = 'busy';
      updateListById(fileId, it);
      ossUrl = await uploadFile(file, filename, (progress) => {
        it.progress = progress.toFixed(2);
        updateListById(fileId, it);
      });

      if (saveToResource) {
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
    }

    it.url = ossUrl;
    it.status = 'success';
    updateListById(fileId, it);
    isUploadBusyRef.current = false;
    setUploadQueue((prev) => prev.filter((it) => it !== fileId));
  });

  useEffect(() => {
    if (isUploadBusyRef.current) return;
    if (uploadQueue.length) {
      void handleUpload();
    } else if (isUploading) {
      setTimeout(() => {
        const mergeList = [...validList.map((it) => it?.url ?? ''), ...list.map((it) => it?.url ?? '')].filter(
          (it) => it,
        );
        const urls = Array.from(new Set(mergeList));

        onFinished?.(urls);
      }, 200);
      setIsUploading(false);
    }
  }, [uploadQueue]);
  // endregion

  return {
    validList,

    hasFile,
    isWaitToUpload,

    updateListById,
    handleOnClickUpload,
  };
};
