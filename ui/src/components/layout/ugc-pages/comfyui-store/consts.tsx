import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';

const columnHelper = createColumnHelper<IAssetItem<IComfyuiWorkflow>>();
export const createComfyuiStoreColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    header: '图标',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    header: '名称',
    cell: ({ row, getValue }) => (
      <span className="transition-colors hover:text-primary-500">{getValue() as string}</span>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    header: '描述',
    cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
  }),
  columnHelper.accessor('user', {
    id: 'user',
    header: '用户',
    cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser, fallbackName: '系统内置' }),
    maxSize: 48,
  }),
  columnHelper.accessor('createdTimestamp', {
    id: 'createdTimestamp',
    header: '创建时间',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 72,
  }),
  columnHelper.accessor('updatedTimestamp', {
    id: 'updatedTimestamp',
    header: '更新时间',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 72,
  }),
];
