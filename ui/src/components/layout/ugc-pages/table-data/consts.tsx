import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { ITableData } from '@/apis/table-data/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<ITableData>>();

export const createTableDataColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
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
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
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
