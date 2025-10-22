import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';

import { Meta, UppyFile } from '@uppy/core';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StepThumbnailGenerator } from '@/components/layout/ugc/step-thumbnail-generator';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { isStepFile, useStepAutoThumbnail } from '@/hooks/use-step-auto-thumbnail';

interface IUploadMediaProps {}

export const UploadMedia: React.FC<IUploadMediaProps> = () => {
  const { t } = useTranslation();
  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  const { mutate } = useSWRConfig();
  const { addTask, currentTask, completeTask, onThumbnailUpdated } = useStepAutoThumbnail();

  // 设置缩略图更新回调
  useEffect(() => {
    onThumbnailUpdated((_mediaFileId) => {
      // 刷新媒体文件列表
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'));
    });
  }, [mutate, onThumbnailUpdated]);

  const handleUploadChange = (urls: string[], files: UppyFile<Meta, Record<string, never>>[]) => {
    // 刷新媒体文件列表
    void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'));

    // 检查是否有 STEP 文件需要生成缩略图
    files.forEach((file) => {
      const fileName = file.name || '';
      const fileUrl = file.uploadURL || (file.meta.remoteUrl as string);
      const mediaFileId = (file.response as any)?.body?.data?.id || file.meta?.mediaFileId;

      if (isStepFile(fileName) && fileUrl && mediaFileId) {
        addTask(mediaFileId, fileUrl, fileName);
      }
    });
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="small" icon={<Upload />}>
            {iconOnlyMode ? null : t('ugc-page.media-data.ugc-view.subtitle.upload.button')}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[40rem] max-w-[40rem]">
          <DialogTitle>{t('ugc-page.media-data.ugc-view.subtitle.upload.title')}</DialogTitle>
          <VinesUploader
            maxSize={30}
            accept={[
              'png',
              'jpeg',
              'jpg',
              'txt',
              'pdf',
              'csv',
              'json',
              'md',
              'zip',
              'word',
              'step',
              'stp',
              'STEP',
              'STP',
              'glb',
              'GLB',
            ]}
            onChange={handleUploadChange}
            basePath="user-files/media"
          />
        </DialogContent>
      </Dialog>

      {/* 隐藏的缩略图生成器 */}
      {currentTask && (
        <StepThumbnailGenerator
          fileUrl={currentTask.fileUrl}
          fileName={currentTask.fileName}
          onComplete={(blob) => {
            completeTask(blob);
          }}
        />
      )}
    </>
  );
};
