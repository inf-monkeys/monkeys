import React, { useMemo, useState } from 'react';

import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { ArrowUpDown, Download, MinusSquare, PlusSquareIcon } from 'lucide-react';
import moment from 'moment/moment';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { IOrder } from '@/apis/authz/team/payment/typings.ts';
import { WorkflowCell } from '@/components/layout/settings/account/consumer-details/workflow-cell.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { RemoteDataTable } from '@/components/ui/data-table/remote.tsx';
import { Spinner } from '@/components/ui/spinner';

interface IConsumerDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ConsumerDetails: React.FC<IConsumerDetailsProps> = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: 5,
    pageIndex: 0,
  });

  const { data: balance } = useTeamBalance();
  const { data: orderListData } = useTeamOrderList(['block-consume'], pagination.pageIndex + 1, pagination.pageSize);

  const balanceTotalConsume = useMemo<[string, string]>(() => {
    const { totalConsume } = balance || {};
    return balanceFormat(totalConsume);
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

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>消费明细</CardTitle>
        <CardDescription>
          累计消费 ￥{balanceTotalConsume[0]}.{balanceTotalConsume[1]}
        </CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end p-6">
          <Button icon={<Download />} size="small">
            下载明细
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orderListData ? (
          <RemoteDataTable
            columns={columns}
            data={orderListData.data ?? []}
            state={{ pagination }}
            rowCount={orderListData.total ?? 0}
            onPaginationChange={setPagination}
          />
        ) : (
          <Spinner loading className="h-10" />
        )}
      </CardContent>
    </Card>
  );
};
