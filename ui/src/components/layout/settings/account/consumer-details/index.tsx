import React, { useMemo, useState } from 'react';

import { ColumnDef, PaginationState } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { IOrder } from '@/apis/authz/team/payment/typings.ts';
import { WorkflowCell } from '@/components/layout/settings/account/consumer-details/workflow-cell.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { RemoteDataTable } from '@/components/ui/data-table/remote';
import { VinesFullLoading } from '@/components/ui/loading';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';

interface IConsumerDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ConsumerDetails: React.FC<IConsumerDetailsProps> = () => {
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: 5,
    pageIndex: 0,
  });

  const { data: balance } = useTeamBalance();
  const { data: orderListData } = useTeamOrderList(['execute_tool'], pagination.pageIndex + 1, pagination.pageSize);

  const balanceTotalConsume = useMemo<[string, string]>(() => {
    const { totalConsume } = balance || {};
    return balanceFormat(totalConsume);
  }, [balance]);

  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: 'type',
      header: t('settings.payment.consumer-details.columns.type.label'),
      cell: ({ cell }) => (
        <span>
          {(cell.getValue() === 'execute_tool' && t('settings.payment.consumer-details.columns.type.execute_tool')) ||
            t('settings.payment.consumer-details.columns.type.other')}
        </span>
      ),
    },
    {
      id: 'workflow',
      header: t('settings.payment.consumer-details.columns.workflow'),
      cell: ({ row }) => <WorkflowCell workflowId={row.original?.['workflowId'] ?? ''} />,
    },
    {
      id: 'workflow-block',
      header: t('settings.payment.consumer-details.columns.tool'),
      cell: ({ row }) => <span>{row.original?.['toolName'] ?? ''}</span>,
    },
    {
      accessorKey: 'createdTimestamp',
      header: ({ column }) => {
        return (
          <span className="flex items-center gap-2">
            {t('settings.payment.consumer-details.columns.createdTimestamp')}
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
            {t('settings.payment.consumer-details.columns.amount')}
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
            {row.original?.['status'] === 'pending' && (
              <Badge color="grey" className="flex-shrink-0 cursor-default">
                {t('settings.payment.consumer-details.columns.status.pending')}
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
        <CardTitle>{t('settings.payment.consumer-details.title')}</CardTitle>
        <CardDescription>
          {t('settings.payment.consumer-details.desc', { amount: balanceTotalConsume.join('.') })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <SmoothTransition className="relative overflow-hidden">
          <AnimatePresence>
            {!orderListData && <VinesFullLoading motionKey="vines-consumer-details-loading" />}
          </AnimatePresence>
          <RemoteDataTable
            columns={columns}
            data={orderListData?.data ?? []}
            state={{ pagination }}
            rowCount={orderListData?.total ?? 0}
            onPaginationChange={setPagination}
          />
        </SmoothTransition>
      </CardContent>
    </Card>
  );
};
