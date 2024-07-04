import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown } from 'lucide-react';

import { IOrder } from '@/apis/authz/team/payment/typings.ts';
import { WorkflowCell } from '@/components/layout/settings/account/consumer-details/workflow-cell.tsx';
import { Badge } from '@/components/ui/badge.tsx';

export const columns: ColumnDef<IOrder>[] = [
  {
    accessorKey: 'type',
    header: '类型',
    cell: ({ cell }) => <span>{(cell.getValue() === 'execute_tool' && '工作流工具运行扣费') || '其他'}</span>,
  },
  {
    id: 'workflow',
    header: '工作流',
    cell: ({ row }) => <WorkflowCell workflowId={row.original?.['workflowId'] ?? ''} />,
  },
  {
    id: 'workflow-block',
    header: '工具',
    cell: ({ row }) => <span>{row.original?.['toolName'] ?? ''}</span>,
  },
  {
    accessorKey: 'createdTimestamp',
    header: ({ column }) => {
      return (
        <span className="flex items-center gap-2">
          创建时间
          <ArrowUpDown
            size={15}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="cursor-pointer transition-opacity hover:opacity-75"
          />
        </span>
      );
    },
    enableSorting: true,
    cell: ({ cell }) => <span>{dayjs(Number(cell.getValue())).format('YYYY-MM-DD HH:mm:ss')}</span>,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <span className="flex items-center gap-2">
          金额
          <ArrowUpDown
            size={15}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="cursor-pointer transition-opacity hover:opacity-75"
          />
        </span>
      );
    },
    enableSorting: true,
    cell: ({ cell, row }) => {
      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-shrink-0 justify-end">
            {'-￥'.concat(((cell.getValue() as number) / 100).toFixed(2))}
          </div>
          {row.original.status === 'pending' && (
            <Badge color="grey" className="flex-shrink-0 cursor-default">
              未支付
            </Badge>
          )}
        </div>
      );
    },
  },
];
