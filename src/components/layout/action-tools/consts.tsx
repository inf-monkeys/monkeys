import React from 'react';

import { createColumnHelper } from '@tanstack/react-table';

import { BlockPricing, WorkflowBlock } from '@/apis/tools/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { pricingText } from '@/components/layout/action-tools/utils.tsx';
import { RenderDescription, RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { formatTime } from '@/utils/time.ts';

const columnHelper = createColumnHelper<IAssetItem<WorkflowBlock>>();

export const ACTION_TOOLS_COLUMNS = [
  columnHelper.accessor('icon', {
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
  columnHelper.accessor('description', {
    id: 'description',
    header: '描述',
    cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
  }),
  columnHelper.accessor('extra.estimateTime', {
    id: 'estimateTime',
    header: '预估执行时间',
    cell: ({ getValue }) => {
      const estimateTime = getValue() as number;
      return <span>预计执行 {estimateTime ? formatTime(estimateTime) : '30 秒'}</span>;
    },
  }),
  columnHelper.accessor('pricing', {
    id: 'pricing',
    header: '费用',
    cell: ({ getValue }) => {
      const pricing = getValue() as BlockPricing | undefined;
      return <span className="text-text2">{pricing ? pricingText(pricing) : '免费'}</span>;
    },
  }),
  columnHelper.display({
    id: 'thirdPartyAccount',
    header: '外部账号',
    // cell: ({ row }) => {
    //   const { required } = determinedCredentialVisible(row.original.credentials, credentialTypesHash);
    //   return required ? (
    //     <span className="cursor-pointer text-primary" onClick={() => {}}>
    //       配置
    //     </span>
    //   ) : (
    //     <span className="text-text2">-</span>
    //   );
    // },
  }),
];
