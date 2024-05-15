import React from 'react';

import { UseNavigateResult } from '@tanstack/react-router';

import { createColumnHelper } from '@tanstack/react-table';
import { t } from 'i18next';

import { BlockPricing, IWorkflowBlock } from '@/apis/tools/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { PricingText } from '@/components/layout/ugc-pages/action-tools/utils.tsx';
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
      cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
    }),
    columnHelper.display({
      id: 'estimateTime',
      cell: ({ row }) => {
        return (
          <span>
            {t('ugc-page.action-tools.utils.estimate.estimate-time', {
              time: formatTime({ seconds: row?.original?.extra?.estimateTime, defaultSeconds: 30 }),
            })}
          </span>
        );
      },
    }),
    columnHelper.accessor('pricing', {
      id: 'pricing',
      cell: ({ getValue }) => {
        const pricing = getValue() as BlockPricing | undefined;
        return (
          <span className="text-text2">
            {pricing ? PricingText({ pricing }) : t('ugc-page.action-tools.utils.pricing-mode.free')}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'thirdPartyAccount',
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
