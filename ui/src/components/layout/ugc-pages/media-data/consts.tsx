import React from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IMediaData } from '@/apis/media-data/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IMediaData>>();

export const createMediaDataColumns = () => [
  columnHelper.display({
    id: 'logo',
    cell: ({ row }) =>
      RenderIcon({ iconUrl: row.original.type.startsWith('image') ? encodeURI(row.original.url) : '' }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue }) => (
      <a className="hover:text-primary-500 transition-colors" target="_blank" rel="noreferrer">
        {getI18nContent(getValue() as string | I18nValue)}
      </a>
    ),
  }),
  columnHelper.accessor('user', {
    id: 'user',
    cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    maxSize: 48,
  }),
  columnHelper.accessor('assetTags', {
    id: 'assetTags',
    maxSize: 96,
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
