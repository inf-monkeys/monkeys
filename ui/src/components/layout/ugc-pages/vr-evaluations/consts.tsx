import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { VRTask } from '@/apis/ugc/vr-evaluation';
import { RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper<IAssetItem<VRTask>>();

export const createVREvaluationTasksColumns = () => [
  columnHelper.accessor('taskName', {
    id: 'title',
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
  }),
  columnHelper.accessor('modelUrl', {
    id: 'modelUrl',
    header: '模型链接',
    cell: ({ getValue }) => (
      <a
        href={getValue() as string}
        target="_blank"
        rel="noreferrer"
        className="hover:text-primary-500 line-clamp-1 text-sm text-muted-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {getValue() as string}
      </a>
    ),
  }),
  columnHelper.display({
    id: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
          {status === 'completed' ? '已完成' : '待评测'}
        </Badge>
      );
    },
    maxSize: 72,
  }),
  columnHelper.display({
    id: 'averageScore',
    header: '平均分',
    cell: ({ row }) => {
      const result = row.original.evaluationResult;
      if (!result) return <span className="text-sm text-muted-foreground">-</span>;

      const scores = Object.values(result);
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;

      return <span className="font-medium">{average.toFixed(1)} / 5.0</span>;
    },
    maxSize: 72,
  }),
  columnHelper.accessor('user', {
    id: 'user',
    header: '创建者',
    cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
    maxSize: 48,
  }),
  columnHelper.accessor('assetTags', {
    id: 'assetTags',
    maxSize: 96,
  }),
  columnHelper.display({
    id: 'createdTimestamp',
    header: '创建时间',
    cell: ({ row }) => RenderTime({ time: row.original.createdTimestamp || 0 }),
    maxSize: 72,
  }),
  columnHelper.display({
    id: 'evaluatedAt',
    header: '完成时间',
    cell: ({ row }) => {
      const evaluatedAt = row.original.evaluatedAt;
      return evaluatedAt ? RenderTime({ time: evaluatedAt }) : <span className="text-sm text-muted-foreground">-</span>;
    },
    maxSize: 72,
  }),
];
