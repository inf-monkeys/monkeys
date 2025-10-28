import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
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
  const { t: tHook, i18n } = useTranslation();

  // 直接在组件函数体内定义，类似 detail-page 的做法
  // 当语言切换时，useTranslation 触发重新渲染，这里会使用新的 i18n.language
  const getDescription = (item: any) => {
    const desc = item.description;
    if (!desc) return null;
    if (typeof desc === 'string') return desc;
    // 如果是多语言对象，根据当前语言返回（与 detail-page 一致）
    if (typeof desc === 'object' && desc !== null) {
      if (i18n.language === 'zh') {
        return desc['zh-CN'] || desc['en-US'] || '';
      } else if (i18n.language === 'en') {
        return desc['en-US'] || desc['zh-CN'] || '';
      }
    }
    return '';
  };

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
          description: (item) => getDescription(item),
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
