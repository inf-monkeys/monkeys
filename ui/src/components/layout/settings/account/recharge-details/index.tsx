import React, { useMemo, useState } from 'react';

import { ColumnDef, PaginationState } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { IOrder, IRechargeOrder } from '@/apis/authz/team/payment/typings.ts';
import { Pay } from '@/components/layout/settings/account/team-property/recharge/pay.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { RemoteDataTable } from '@/components/ui/data-table/remote';
import { VinesFullLoading } from '@/components/ui/loading';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';

interface IRechargeDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const RechargeDetails: React.FC<IRechargeDetailsProps> = () => {
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: 5,
    pageIndex: 0,
  });

  const { data: balance } = useTeamBalance();
  const { data: orderListData } = useTeamOrderList(
    ['recharge', 'admin_recharge'],
    pagination.pageIndex + 1,
    pagination.pageSize,
  );

  const balanceTotalReCharge = useMemo<[string, string]>(() => balanceFormat(balance?.totalReCharge), [balance]);

  const columns: ColumnDef<IOrder>[] = [
    {
      accessorKey: 'payment',
      header: t('settings.payment.recharge-details.columns.type.label'),
      cell: ({ row }) => (
        <span>
          {(row.original?.['platform'] === 'wxpay' && t('settings.payment.recharge-details.columns.type.wxpay')) ||
            t('settings.payment.recharge-details.columns.type.other')}
        </span>
      ),
    },
    {
      accessorKey: 'createdTimestamp',
      header: ({ column }) => {
        return (
          <span className="flex items-center gap-2">
            {t('settings.payment.recharge-details.columns.createdTimestamp')}
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
            {t('settings.payment.recharge-details.columns.amount')}
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
              {status === 'pending' && t('settings.payment.recharge-details.columns.status.pending')}
              {status === 'paid' && t('settings.payment.recharge-details.columns.status.paid')}
              {status === 'delivered' && t('settings.payment.recharge-details.columns.status.delivered')}
              {status === 'closed' && t('settings.payment.recharge-details.columns.status.closed')}
            </Badge>
          </div>
        );
      },
    },
    {
      header: t('settings.payment.recharge-details.columns.operate.label'),
      cell: ({ row: { original } }) => (
        <Pay order={original as IRechargeOrder}>
          <Button variant="outline" size="small">
            {t('settings.payment.recharge-details.columns.operate.check')}
          </Button>
        </Pay>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>{t('settings.payment.recharge-details.title')}</CardTitle>
        <CardDescription>
          {t('settings.payment.recharge-details.desc', { amount: balanceTotalReCharge.join('.') })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SmoothTransition className="relative overflow-hidden">
          <AnimatePresence>
            {!orderListData && <VinesFullLoading motionKey="vines-recharge-details-loading" />}
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
