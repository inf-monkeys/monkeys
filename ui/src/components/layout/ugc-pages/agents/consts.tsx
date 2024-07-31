import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IAgent } from '@/apis/agents/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IAgent>>();

export const createAgentsColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ row, getValue }) => (
      <a
        className="hover:text-primary-500 transition-colors"
        href={`/${row.original.teamId}/agent/${row.original.id}`}
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
  columnHelper.accessor('model', {
    id: 'model',
    cell: ({ getValue }) => getValue() as string,
  }),
  columnHelper.accessor('customModelName', {
    id: 'customModelName',
    cell: ({ getValue }) => getValue() as string | undefined,
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
    cell: ({ getValue }) => RenderTime({ time: getValue() as string }),
    maxSize: 72,
  }),
  columnHelper.accessor('updatedTimestamp', {
    id: 'updatedTimestamp',
    cell: ({ getValue }) => RenderTime({ time: getValue() as string }),
    maxSize: 72,
  }),
];
