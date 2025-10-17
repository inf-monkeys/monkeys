import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcMediaData, useUgcMediaData } from '@/apis/ugc';
import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createMediaDataColumns } from '@/components/layout/ugc-pages/media-data/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/media-data/operate-area';
import { UploadMedia } from '@/components/layout/ugc-pages/media-data/upload';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const MediaData: React.FC = () => {
  const { t: tHook } = useTranslation();

  return (
    <main className="size-full">
      <UgcView
        assetKey="media-data"
        assetType="media-file"
        assetName={tHook('components.layout.main.sidebar.list.media.media-data.label')}
        useUgcFetcher={useUgcMediaData}
        preloadUgcFetcher={preloadUgcMediaData}
        createColumns={() => createMediaDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
          cover: (item) => {
            // 判断文件类型
            const fileName = String(item.name || item.displayName || '');
            const parts = fileName.split('.');
            const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
            const isTextFile = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(extension);
            const isImageFile =
              item.type?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);

            if (isTextFile) {
              // 文本文件显示内容预览 - 与图片尺寸保持一致
              return (
                <div className="h-36 w-36 overflow-hidden rounded">
                  <AssetContentPreview asset={item} isThumbnail={true} className="h-full w-full" />
                </div>
              );
            } else if (isImageFile && item.url) {
              // 图片文件显示图片预览
              return RenderIcon({ iconUrl: item.url, size: 'gallery' });
            } else {
              // 其他文件类型显示默认图标
              return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
            }
          },
        }}
        subtitle={<UploadMedia />}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
      />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/media-data/')({
  component: MediaData,
});
