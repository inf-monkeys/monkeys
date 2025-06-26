import { createColumnHelper } from '@tanstack/react-table';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { EvaluationModule } from '@/apis/evaluation/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { RenderDescription, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper<IAssetItem<EvaluationModule>>();

export const createEvaluationModulesColumns = () => [
  columnHelper.accessor('displayName', {
    id: 'title',
    cell: ({ row, getValue }) => (
      <a
        className="hover:text-primary-500 transition-colors"
        href={`/${row.original.teamId}/evaluations/${row.original.id}/leaderboard`}
        target="_blank"
        rel="noreferrer"
      >
        {getValue() as string}
      </a>
    ),
  }),
  columnHelper.accessor('description', {
    id: 'description',
    cell: ({ getValue }) => RenderDescription({ description: (getValue() as string) || '暂无描述' }),
  }),
  columnHelper.accessor('evaluationCriteria', {
    id: 'evaluationCriteria',
    cell: ({ getValue }) => (
      <span className="line-clamp-2 text-sm text-muted-foreground">{(getValue() as string) || '未设置评测标准'}</span>
    ),
  }),
  columnHelper.display({
    id: 'status',
    header: '状态',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? '启用' : '禁用'}</Badge>;
    },
    maxSize: 72,
  }),
  columnHelper.display({
    id: 'participants',
    header: '参与者',
    cell: ({ row }) => {
      const count = (row.original as EvaluationModule).participantAssetIds?.length || 0;
      return <span className="text-sm text-muted-foreground">{count} 个参与者</span>;
    },
    maxSize: 96,
  }),
  columnHelper.accessor('user', {
    id: 'user',
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
    id: 'updatedTimestamp',
    header: '更新时间',
    cell: ({ row }) => RenderTime({ time: row.original.updatedTimestamp || 0 }),
    maxSize: 72,
  }),
];
