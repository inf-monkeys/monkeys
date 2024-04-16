import React from 'react';

import { UseNavigateResult } from '@tanstack/react-router';

import { createColumnHelper } from '@tanstack/react-table';

import { BlockPricing, IWorkflowBlock } from '@/apis/tools/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { pricingText } from '@/components/layout/ugc-pages/action-tools/utils.ts';
import { formatTime } from '@/utils/time.ts';

const columnHelper = createColumnHelper<IAssetItem<IWorkflowBlock>>();

interface ICreateActionToolsColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    navigate: UseNavigateResult<string>;
  };
}

export const createActionToolsColumns = ({ hooks }: ICreateActionToolsColumnsProps) => {
  return [
    columnHelper.accessor('icon', {
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
              to: `/$teamId/action-tools/${row.original.name}`,
            });
          }}
        >
          {getValue() as string}
        </span>
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
};
