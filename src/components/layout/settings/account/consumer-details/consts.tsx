import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MinusSquare, PlusSquareIcon } from 'lucide-react';
import moment from 'moment';

import { IOrder } from '@/apis/authz/team/payment/typings.ts';
import { WorkflowCell } from '@/components/layout/settings/account/consumer-details/workflow-cell.tsx';
import { Badge } from '@/components/ui/badge.tsx';

export const columns: ColumnDef<IOrder>[] = [
  {
    id: 'type-column',
    header: '',
    size: 10,
    cell: ({ row }) => (row.original.type === 'incr' ? <PlusSquareIcon /> : <MinusSquare />),
  },
  {
    accessorKey: 'tag',
    header: '类型',
    cell: ({ cell }) => <span>{(cell.getValue() === 'block-consume' && '工作流组件运行扣费') || '其他'}</span>,
  },
  {
    id: 'workflow',
    header: '工作流',
    cell: ({ row }) => <WorkflowCell workflowId={row.original.detail['workflowId']} />,
  },
  {
    id: 'workflow-block',
    header: '工作流组件',
    cell: ({ row }) => <span>{row.original.detail['blockName']}</span>,
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
    cell: ({ cell }) => <span>{moment(cell.getValue() as number).format('YYYY-MM-DD HH:mm:ss')}</span>,
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
            {(row.original.type === 'decr' ? '-' : '+')
              .concat(' ￥')
              .concat(((cell.getValue() as number) / 100).toFixed(2))}
          </div>
          {row.original.status === 'created' && (
            <Badge color="grey" className="flex-shrink-0 cursor-default">
              未支付
            </Badge>
          )}
        </div>
      );
    },
  },
];
