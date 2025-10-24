import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { DesignSoftwareTask } from '@/apis/ugc/design-software-evaluation';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper<IAssetItem<DesignSoftwareTask>>();

const statusMap = {
  pending: { label: '待评测', variant: 'secondary' as const },
  'in-progress': { label: '评测中', variant: 'default' as const },
  completed: { label: '已完成', variant: 'default' as const },
};

export const createDesignSoftwareEvaluationTasksColumns = () => [
  columnHelper.accessor('softwareName', {
    id: 'softwareName',
    header: '软件名称',
    cell: ({ getValue, row }) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{getValue() as string}</span>
        {row.original.softwareVersion && (
          <span className="text-xs text-muted-foreground">版本: {row.original.softwareVersion}</span>
        )}
      </div>
    ),
  }),
  columnHelper.accessor('taskDescription', {
    id: 'taskDescription',
    header: '测评描述',
    cell: ({ getValue }) => (
      <span className="line-clamp-2 text-sm text-muted-foreground">{(getValue() as string) || '暂无描述'}</span>
    ),
  }),
  columnHelper.display({
    id: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusInfo = statusMap[status] || statusMap.pending;
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    },
    maxSize: 72,
  }),
  columnHelper.display({
    id: 'averageScore',
    header: '综合评分',
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
