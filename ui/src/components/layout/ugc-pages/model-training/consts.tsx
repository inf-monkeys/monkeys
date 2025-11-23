import { Link } from '@tanstack/react-router';

import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';
import { TFunction } from 'i18next';
import { MoreHorizontal } from 'lucide-react';

import { IModelTraining } from '@/apis/model-training/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcCreateColumnsProps } from '@/components/layout/ugc/typings.ts';
import { RenderDescription, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Button } from '@/components/ui/button';
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
    cell: ({ getValue, row }) => {
      const versionType = (row.original as any).versionType ?? 1;
      const detailPath =
        versionType === 2 ? '/$teamId/model-training-v2/$modelTrainingId' : '/$teamId/model-training/$modelTrainingId';
      return (
        <Link
          className="hover:text-primary-500 cursor-pointer transition-colors"
          to={detailPath as any}
          params={(prev: any) => ({
            ...prev,
            modelTrainingId: row.original.id,
          })}
        >
          {getI18nContent(getValue() as string | I18nValue)}
        </Link>
      );
    },
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
  // 操作列
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="small"
        className="h-8 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
    maxSize: 40,
  }),
];
