import { I18nValue } from '@inf-monkeys/monkeys';
import { createColumnHelper } from '@tanstack/react-table';

import { IModelTraining } from '@/apis/model-training/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderTime } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { getI18nContent } from '@/utils';

const columnHelper = createColumnHelper<IAssetItem<IModelTraining>>();

export const createModelTrainingDetailColumns = () => [
  columnHelper.accessor('displayName', {
    id: 'title',
    header: '名称',
    cell: ({ getValue }) => <div className="font-medium">{getI18nContent(getValue() as string | I18nValue)}</div>,
  }),
  columnHelper.accessor('description', {
    id: 'description',
    header: '描述',
    cell: ({ getValue }) =>
      RenderDescription({
        description: getI18nContent(getValue() as string | I18nValue),
      }),
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: '状态',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const statusMap = {
        idle: '空闲',
        pending: '等待中',
        running: '运行中',
        completed: '已完成',
        failed: '失败',
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 text-green-800'
              : status === 'running'
                ? 'bg-blue-100 text-blue-800'
                : status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusMap[status as keyof typeof statusMap] || status}
        </span>
      );
    },
  }),
  columnHelper.accessor('createdTimestamp', {
    id: 'createdTimestamp',
    header: '创建时间',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 120,
  }),
  columnHelper.accessor('updatedTimestamp', {
    id: 'updatedTimestamp',
    header: '更新时间',
    cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
    maxSize: 120,
  }),
];
