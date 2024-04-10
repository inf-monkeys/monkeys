import React from 'react';

import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IVectorFrontEnd } from '@/apis/vector/typings.ts';
import { RenderDescription, RenderIcon, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';

const columnHelper = createColumnHelper<IAssetItem<IVectorFrontEnd>>();

export const createTextDataColumn = [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    header: '图标',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    header: '名称',
    cell: ({ getValue }) => (
      <a className="transition-colors hover:text-primary-500" target="_blank" rel="noreferrer">
        {getValue() as string}
      </a>
    ),
  }),
  columnHelper.accessor('user', {
    id: 'user',
    header: '用户',
    cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    maxSize: 48,
  }),
  columnHelper.accessor('description', {
    id: 'description',
    header: '描述',
    cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
  }),
];
