import React from 'react';

import { UseNavigateResult } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';
import { t } from 'i18next';

import { IComfyuiModel, IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IComfyuiModel>>();

interface ICreateImageModelsColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    navigate: UseNavigateResult<string>;
    copy: (valueToCopy: any) => void;
  };
}

export const createImageModelsColumns = ({ hooks }: ICreateImageModelsColumnsProps) => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue }) => (
      <span
        className="hover:text-primary-500 cursor-pointer transition-colors"
        onClick={() => {
          void hooks.navigate({
            // @ts-ignore
            to: `/$teamId/image-models/${row.original.id}`,
          });
        }}
      >
        {getI18nContent(getValue() as string | I18nValue)}
      </span>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
  }),
  columnHelper.accessor('serverRelations', {
    id: 'types',
    maxSize: 96,
    cell: ({ getValue }) => {
      const rawRelations = getValue();
      const types = rawRelations.reduce((acc: IComfyuiModelType[], { type }) => {
        if (type && !acc.find((t) => t.name === type.name)) {
          acc.push(type);
        }
        return acc;
      }, []);
      return (
        <>
          {types.length === 0 ? (
            <span className="text-xs">{t('ugc-page.image-models.types.other')}</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1 overflow-hidden text-xs">
              {types.map((t) => {
                return (
                  <Tag color="primary" size="xs" key={t.name}>
                    {t.displayName || t.name}
                  </Tag>
                );
              })}
            </div>
          )}
        </>
      );
    },
  }),
  columnHelper.accessor('sha256', {
    id: 'sha256',
    cell: ({ getValue }) => {
      const sha256 = getValue() as string;
      return (
        <Tooltip>
          <TooltipTrigger onClick={() => hooks.copy(sha256)}>
            {sha256.slice(0, 6)}...{sha256.slice(-6)}
          </TooltipTrigger>
          <TooltipContent>{sha256}</TooltipContent>
        </Tooltip>
      );
    },
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
