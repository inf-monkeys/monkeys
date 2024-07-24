import React from 'react';

import { UseNavigateResult } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';
import { t } from 'i18next';

import { ICommonTool, ToolPricing } from '@/apis/tools/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { PricingText } from '@/components/layout/ugc-pages/action-tools/utils.tsx';
import { getI18nContent } from '@/utils';
import { formatTime } from '@/utils/time.ts';

const columnHelper = createColumnHelper<IAssetItem<ICommonTool>>();

interface ICreateToolsColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    navigate: UseNavigateResult<string>;
  };
}

export const createToolsColumns = ({ hooks }: ICreateToolsColumnsProps) => {
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
          className="hover:text-primary-500 cursor-pointer transition-colors"
          onClick={() => {
            void hooks.navigate({
              // @ts-ignore
              to: `/$teamId/action-tools/${row.original.name}`,
            });
          }}
        >
          {getI18nContent(getValue() as string | I18nValue)}
        </span>
      ),
    }),
    columnHelper.accessor('type', {
      id: 'type',
      cell: ({ getValue }) => getValue() as string,
    }),
    columnHelper.accessor('description', {
      id: 'description',
      cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
    }),
    columnHelper.display({
      id: 'estimateTime',
      cell: ({ row }) => {
        return (
          row.original.toolType === 'tool' && (
            <span>
              {t('ugc-page.action-tools.utils.estimate.estimate-time', {
                time: formatTime({ seconds: row?.original?.extra?.estimateTime, defaultSeconds: 30 }),
              })}
            </span>
          )
        );
      },
    }),
    columnHelper.accessor('extra', {
      id: 'pricing',
      cell: ({ getValue, row }) => {
        return (
          row.original.toolType === 'tool' && (
            <span className="text-text2">
              {getValue()
                ? PricingText({ pricing: getValue() as ToolPricing })
                : t('ugc-page.action-tools.utils.pricing-mode.FREE')}
            </span>
          )
        );
      },
    }),
  ];
};
