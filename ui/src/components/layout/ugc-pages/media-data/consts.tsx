import React from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IMediaData } from '@/apis/media-data/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import { RenderDescription, RenderIcon, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IMediaData>>();

export const createMediaDataColumns = () => [
  columnHelper.display({
    id: 'logo',
    cell: ({ row }) => {
      // 判断文件类型
      const fileName = String(row.original?.name || (row.original as any)?.displayName || '');
      const parts = fileName.split('.');
      const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
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
        return RenderIcon({ iconUrl: encodeURI(row.original.url) });
      } else {
        // 其他文件显示默认图标
        return RenderIcon({ iconUrl: row.original.iconUrl || '' });
      }
    },
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue }) => (
      <a className="hover:text-primary-500 transition-colors" target="_blank" rel="noreferrer">
        {getI18nContent(getValue() as string | I18nValue)}
      </a>
    ),
    size: 180,
    maxSize: 200,
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getValue() as string | I18nValue }),
    size: 400,
  }),
  columnHelper.accessor('createdTimestamp', {
    id: 'createdTimestamp',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 72,
  }),
  columnHelper.accessor('updatedTimestamp', {
    id: 'updatedTimestamp',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 72,
  }),
];
