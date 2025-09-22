import { Link } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';
import { TFunction } from 'i18next';

import { IModelTraining } from '@/apis/model-training/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IModelTraining>>();

interface ICreateModelTrainingColumnsProps extends IUgcCreateColumnsProps {
  hooks: {
    tHook: TFunction;
  };
}

export const createModelTrainingColumns = ({ hooks }: ICreateModelTrainingColumnsProps) => [
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ getValue, row }) => (
      <Link
        className="hover:text-primary-500 cursor-pointer transition-colors"
        to={`/$teamId/model-training/${row.original.id}`}
      >
        {getI18nContent(getValue() as string | I18nValue)}
      </Link>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: getI18nContent(getValue() as string | I18nValue) }),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    cell: ({ getValue }) => hooks.tHook('ugc-page.model-training.ugc-view.columns.status.options.' + getValue()),
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
