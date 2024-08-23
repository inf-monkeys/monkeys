import React from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';
import { t } from 'i18next';

import { IComfyuiModel, IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderIcon, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Tag } from '@/components/ui/tag';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IComfyuiModel>>();

export const createImageModelsColumns = () => [
  columnHelper.accessor('iconUrl', {
    id: 'logo',
    cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
    maxSize: 48,
  }),
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue }) => (
      <a className="hover:text-primary-500 transition-colors" target="_blank" rel="noreferrer">
        {getI18nContent(getValue() as string | I18nValue)}
      </a>
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
