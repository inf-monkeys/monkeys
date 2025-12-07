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

export const NeuralModels: React.FC = () => {
  const { t: tHook, i18n } = useTranslation();

  // 包装useUgcMediaData，只显示神经模型
  const useNeuralModelsOnly = (dto: any) => useUgcMediaData(dto, 'only');

  const getDescription = (item: any) => {
    const desc = item.description;
    if (!desc) return null;
    if (typeof desc === 'string') return desc;
    if (typeof desc === 'object' && desc !== null) {
      if (i18n.language === 'zh') {
        return desc['zh-CN'] || desc['en-US'] || '';
      } else if (i18n.language === 'en') {
        return desc['en-US'] || desc['zh-CN'] || '';
      }
    }
    return '';
  };

  // 创建自定义列定义，修改 logo 列以支持神经模型的 JSON URL
  const createNeuralModelColumns = () => {
    const columns = createMediaDataColumns();
    const logoColumn = columns.find((col) => col.id === 'logo');
    if (logoColumn) {
      logoColumn.cell = ({ row }: any) => {
        // 优先检查 JSON 的 params 中是否携带 url
        const fileName = String(row.original?.name || row.original?.displayName || '');
        const parts = fileName.split('.');
        const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
        const jsonUrl = row.original?.params?.jsonData?.url as string | undefined;

        if (extension === 'json' && jsonUrl) {
          return RenderIcon({ iconUrl: jsonUrl });
        }

        // 否则使用原始的渲染逻辑（复制自 createMediaDataColumns 中的 logo 列）
        const isTextFile = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(extension);
        const isImageFile =
          row.original.type?.startsWith('image') ||
          ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);

        if (isTextFile) {
          // 文本文件显示内容预览
          return (
            <div className="h-12 w-12 overflow-hidden rounded">
              <AssetContentPreview asset={row.original} isThumbnail={true} className="h-full w-full" />
            </div>
          );
        } else if (isImageFile && row.original.url) {
          // 图片文件显示图片预览
          const rawUrl = row.original.url;
          const normalizedUrl = rawUrl.includes('%25') ? decodeURIComponent(rawUrl) : rawUrl;
          return RenderIcon({ iconUrl: normalizedUrl });
        } else {
          // 其他文件显示默认图标
          return RenderIcon({ iconUrl: row.original.iconUrl || '' });
        }
      };
    }
    return columns;
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="neural-models"
        assetType="media-file"
        assetName={tHook('components.layout.main.sidebar.list.designs.neural-models.label', {
          defaultValue: '神经模型',
        })}
        useUgcFetcher={useNeuralModelsOnly}
        preloadUgcFetcher={preloadUgcMediaData}
        createColumns={() => createNeuralModelColumns()}
        // 过滤条件：只显示 params.type 为 'neural-model' 的媒体文件
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
            // 神经模型主要是JSON文件，但也可能包含图片和文本
            const fileName = String(item.name || item.displayName || '');
            const parts = fileName.split('.');
            const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
            const isTextFile = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(extension);
            const isImageFile =
              item.type?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);

            // 优先：如果 JSON 的 params 中携带 url，则以该 url 作为缩略图
            const jsonUrl = (item as any)?.params?.jsonData?.url as string | undefined;
            if (extension === 'json' && jsonUrl) {
              return RenderIcon({ iconUrl: jsonUrl, size: 'gallery' });
            }

            if (isTextFile) {
              // JSON和文本文件显示内容预览
              return (
                <div className="h-36 w-36 overflow-hidden rounded">
                  <AssetContentPreview asset={item} isThumbnail={true} className="h-full w-full" />
                </div>
              );
            } else if (isImageFile && item.url) {
              // 图片文件显示图片预览
              const normalizedUrl = item.url.includes('%25') ? decodeURIComponent(item.url) : item.url;
              return RenderIcon({ iconUrl: normalizedUrl, size: 'gallery' });
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

export const Route = createLazyFileRoute('/$teamId/neural-models/')({
  component: NeuralModels,
});
