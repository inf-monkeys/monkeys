import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown, MinusSquare, PlusSquareIcon } from 'lucide-react';

import { IOrder } from '@/apis/authz/team/payment/typings.ts';
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
    cell: ({ cell }) => (
      <span>
        {(cell.getValue() === 'recharge' && '充值') ||
          (cell.getValue() === 'admin-recharge' && '充值（管理员）') ||
          '其他'}
      </span>
    ),
  },
  {
    accessorKey: 'payment',
    header: '支付类型',
    cell: ({ row }) => (
      <span>
        {(row.original.tag === 'recharge' && '微信支付') ||
          (row.original.tag === 'admin-recharge' && '管理员后台充值') ||
          '其他'}
      </span>
    ),
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
    cell: ({ cell }) => <span>{dayjs(cell.getValue() as number).format('YYYY-MM-DD HH:mm:ss')}</span>,
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
