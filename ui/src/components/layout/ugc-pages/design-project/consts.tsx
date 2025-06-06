import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons.ts';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IDesignProject>>();

export const createDesignProjectsColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) =>
      RenderIcon({ iconUrl: (getValue() as string | undefined) ?? DEFAULT_DESIGN_PROJECT_ICON_URL }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ row, getValue }) => (
      <a
        className="hover:text-primary-500 transition-colors"
        href={`/${row.original.teamId}/design/${row.original.id}`}
        target="_blank"
        rel="noreferrer"
      >
        {getI18nContent(getValue() as string | I18nValue)}
      </a>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
  }),
  columnHelper.accessor('boardIds', {
    id: 'boardCount',
    cell: ({ getValue }) => (getValue() ?? []).length,
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
