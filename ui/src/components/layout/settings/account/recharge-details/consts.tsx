import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown } from 'lucide-react';

import { IOrder, IRechargeOrder } from '@/apis/authz/team/payment/typings.ts';
import { Pay } from '@/components/layout/settings/account/team-property/recharge/pay.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';

export const columns: ColumnDef<IOrder>[] = [
  {
    accessorKey: 'payment',
    header: '支付类型',
    cell: ({ row }) => <span>{(row.original?.['platform'] === 'wxpay' && '微信支付') || '其他'}</span>,
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
      const status = row.original?.['status'];
      return (
        <div className="flex items-center gap-2">
          <div className="flex flex-shrink-0 justify-end">
            {'+￥'.concat(((cell.getValue() as number) / 100).toFixed(2))}
          </div>
          <Badge color="grey" className="flex-shrink-0 cursor-default">
            {status === 'pending' && '待支付'}
            {status === 'paid' && '已支付'}
            {status === 'delivered' && '已到账'}
            {status === 'closed' && '已关闭'}
          </Badge>
        </div>
      );
    },
  },
  {
    header: '操作',
    cell: ({ row: { original } }) => (
      <Pay order={original as IRechargeOrder}>
        <Button variant="outline" size="small">
          查看
        </Button>
      </Pay>
    ),
  },
];
