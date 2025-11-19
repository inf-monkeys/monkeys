import React, { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { Meta, Uppy, UppyFile } from '@uppy/core';
import { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getMediaAsset } from '@/apis/media-data';
import { updateAssetTag } from '@/apis/ugc';
import { IAssetTag } from '@/apis/ugc/typings';
import { StepThumbnailGenerator } from '@/components/layout/ugc/step-thumbnail-generator';
import { UploadTagSelector } from '@/components/layout/ugc-pages/media-data/upload/tag-selector';
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
  const [selectedTags, setSelectedTags] = useState<IAssetTag[]>([]);
  const uppyRef = useRef<Uppy<Meta, Record<string, never>> | null>(null);
  const uploadedFileIdsRef = useRef<string[]>([]);

  // 设置缩略图更新回调
  useEffect(() => {
    onThumbnailUpdated((_mediaFileId) => {
      // 刷新媒体文件列表
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'));
    });
  }, [mutate, onThumbnailUpdated]);

  // 定义 upload-success 事件处理器
  const handleUploadSuccessRef = useRef<
    ((file: UppyFile<Meta, Record<string, never>> | undefined, response: any) => void) | null
  >(null);

  // 初始化事件处理器
  if (!handleUploadSuccessRef.current) {
    handleUploadSuccessRef.current = (file: UppyFile<Meta, Record<string, never>> | undefined, response: any) => {
      if (!file || !response) return;
      const mediaFileId =
        (response as any)?.body?.data?.id || file.meta?.mediaFileId || (response as any)?.body?.data?.mediaFileId;
      if (mediaFileId) {
        if (!uploadedFileIdsRef.current.includes(mediaFileId)) {
          uploadedFileIdsRef.current.push(mediaFileId);
        }
      }
    };
  }

  const handleUploadChange = async (urls: string[], files: UppyFile<Meta, Record<string, never>>[]) => {
    // 等待一段时间，确保 upload-success 事件已经触发
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 优先使用从 upload-success 事件收集的文件 ID
    let uploadedFileIds = [...uploadedFileIdsRef.current];

    // 如果 uppy 实例可用，从 uppy 获取最新的文件状态作为补充
    if (uppyRef.current && uploadedFileIds.length === 0) {
      const uppyFiles = uppyRef.current.getFiles();
      uploadedFileIds = uppyFiles
        .map((file) => {
          const mediaFileId =
            (file.response as any)?.body?.data?.id ||
            file.meta?.mediaFileId ||
            (file.response as any)?.body?.data?.mediaFileId ||
            (file.response as any)?.data?.id ||
            // 秒上传时，从 meta 中获取（rapid-upload 插件可能设置在这里）
            (file.meta as any)?.assetId;
          return mediaFileId;
        })
        .filter((id): id is string => !!id);
    }

    // 如果还是失败，尝试从传入的 files 参数获取
    if (uploadedFileIds.length === 0) {
      uploadedFileIds = files
        .map((file) => {
          const mediaFileId =
            (file.response as any)?.body?.data?.id ||
            file.meta?.mediaFileId ||
            (file.response as any)?.body?.data?.mediaFileId ||
            (file.response as any)?.data?.id ||
            // 秒上传时，从 meta 中获取
            (file.meta as any)?.assetId;
          return mediaFileId;
        })
        .filter((id): id is string => !!id);
    }

    // 如果有选中的标签，关联到上传的文件
    if (selectedTags.length > 0 && uploadedFileIds.length > 0) {
      const newTagIds = selectedTags.map((tag) => tag.id);
      try {
        // 对于每个上传的文件，先获取现有标签，然后合并新标签
        await Promise.all(
          uploadedFileIds.map(async (mediaFileId) => {
            try {
              // 获取资产的现有信息（包含标签）
              const asset = await getMediaAsset(mediaFileId);
              // 获取现有标签ID列表（assetTags 可能是 IAssetTag[] 或 any[]）
              const currentTagIds = (asset.assetTags || [])
                .map((tag: IAssetTag | any) => {
                  if (typeof tag === 'object' && tag.id) {
                    return tag.id;
                  }
                  if (typeof tag === 'string') {
                    return tag;
                  }
                  return null;
                })
                .filter((id): id is string => typeof id === 'string' && id.length > 0);
              // 合并现有标签和新标签（去重）
              const mergedTagIds = [...new Set([...currentTagIds, ...newTagIds])];
              // 更新标签（使用合并后的标签列表）
              await updateAssetTag('media-file', mediaFileId, { tagIds: mergedTagIds });
            } catch (error) {
              // 如果获取资产信息失败（可能是新上传的文件，还没有标签），直接使用新标签
              await updateAssetTag('media-file', mediaFileId, { tagIds: newTagIds });
            }
          }),
        );
        toast.success(t('common.update.success'));
        // 上传成功后清空选中的标签，方便下次上传
        setSelectedTags([]);
      } catch (error) {
        toast.error(t('common.update.error'));
      }
    }

    // 刷新媒体文件列表
    void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'));

    // 检查是否有 STEP 文件需要生成缩略图
    files.forEach((file) => {
      const fileName = (file.meta as any)?.originalName || file.name || '';
      const fileUrl = file.uploadURL || (file.meta.remoteUrl as string);
      const mediaFileId =
        (file.response as any)?.body?.data?.id ||
        file.meta?.mediaFileId ||
        (file.response as any)?.body?.data?.mediaFileId;

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
          <div className="flex flex-col gap-4">
            {/* 标签选择器 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('asset.detail.tags')}</label>
              <UploadTagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
            </div>
            {/* 文件上传器 */}
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
                'doc',
                'docx',
                'step',
                'stp',
                'glb',
              ]}
              onChange={handleUploadChange}
              basePath="user-files/media"
              uppy$={
                new (class extends EventEmitter<Uppy<Meta, Record<string, never>>> {
                  emit = (value: Uppy<Meta, Record<string, never>>) => {
                    uppyRef.current = value;
                    // 清空之前的文件 ID 列表
                    uploadedFileIdsRef.current = [];
                    // 设置 upload-success 事件监听器
                    if (handleUploadSuccessRef.current) {
                      value.on('upload-success', handleUploadSuccessRef.current);
                    }
                    return this;
                  };
                })()
              }
            />
          </div>
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
