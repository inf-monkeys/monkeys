import React from 'react';

import { createColumnHelper } from '@tanstack/react-table';

import { ISDModel } from '@/apis/sd/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';

const columnHelper = createColumnHelper<IAssetItem<ISDModel>>();

export const createImageModelsColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('name', {
    id: 'title',
    cell: ({ getValue }) => (
      <a className="transition-colors hover:text-primary-500" target="_blank" rel="noreferrer">
        {getValue() as string}
      </a>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
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
