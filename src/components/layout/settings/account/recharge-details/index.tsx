import React, { useMemo } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, MinusSquare, PlusSquareIcon } from 'lucide-react';
import moment from 'moment';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { IOrder } from '@/apis/authz/team/payment/typings.ts';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { DataTable } from '@/components/ui/data-table';

interface IRechargeDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const RechargeDetails: React.FC<IRechargeDetailsProps> = () => {
  const { data: balance } = useTeamBalance();
  const { data: orderListData } = useTeamOrderList(['recharge', 'admin-recharge']);

  const balanceTotalReCharge = useMemo<[string, string]>(() => {
    const { totalReCharge } = balance || {};
    return balanceFormat(totalReCharge);
  }, [balance]);

  console.log(orderListData);

  const columns: ColumnDef<IOrder>[] = [
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
      accessorKey: 'tag',
      header: '支付类型',
      cell: ({ cell }) => (
        <span>
          {(cell.getValue() === 'recharge' && '微信支付') ||
            (cell.getValue() === 'admin-recharge' && '管理员后台充值') ||
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

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>充值明细</CardTitle>
        <CardDescription>
          累计充值 ￥{balanceTotalReCharge[0]}.{balanceTotalReCharge[1]}
        </CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end p-6">
          <Button icon={<Download />} size="small">
            下载明细
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={orderListData?.data ?? []} pagination />
      </CardContent>
    </Card>
  );
};
