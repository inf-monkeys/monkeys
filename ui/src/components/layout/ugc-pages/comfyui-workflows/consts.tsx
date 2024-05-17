import { UseNavigateResult } from '@tanstack/react-router';

import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';

const columnHelper = createColumnHelper<IAssetItem<IComfyuiWorkflow>>();

interface ICreateComfyuiWorkflowColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    navigate: UseNavigateResult<string>;
  };
}

export const createComfyuiWorkflowColumns = ({ hooks }: ICreateComfyuiWorkflowColumnsProps) => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    header: '图标',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    header: '名称',
    cell: ({ getValue, row }) => (
      <span
        className="cursor-pointer transition-colors hover:text-primary-500"
        onClick={() => {
          void hooks.navigate({
            to: `/$teamId/comfyui/${row.original.id}`,
          });
        }}
      >
        {getValue() as string}
      </span>
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
  columnHelper.accessor('assetTags', {
    id: 'assetTags',
    header: '标签',
    maxSize: 96,
  }),
  columnHelper.accessor('createdTimestamp', {
    id: 'createdTimestamp',
    header: '创建时间',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 72,
  }),
];
