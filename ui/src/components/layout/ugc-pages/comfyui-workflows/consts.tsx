import { UseNavigateResult } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { I18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IComfyuiWorkflow>>();

interface ICreateComfyuiWorkflowColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    navigate: UseNavigateResult<string>;
  };
}

export const createComfyuiWorkflowColumns = ({ hooks }: ICreateComfyuiWorkflowColumnsProps) => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue, row }) => (
      <span
        className="cursor-pointer transition-colors hover:text-primary-500"
        onClick={() => {
          void hooks.navigate({
            to: `/$teamId/comfyui/${row.original.id}`,
          });
        }}
      >
        {I18nContent(getValue() as string | I18nValue)}
      </span>
    ),
  }),
  columnHelper.accessor('user', {
    id: 'user',
    cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    maxSize: 48,
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: I18nContent(getValue() as string | I18nValue) }),
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
];
