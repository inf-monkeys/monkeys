import React, { useMemo, useState } from 'react';

import { PaginationState } from '@tanstack/react-table';
import { AnimatePresence } from 'framer-motion';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { columns } from '@/components/layout/settings/account/consumer-details/consts.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { RemoteDataTable } from '@/components/ui/data-table/remote.tsx';
import { Loading } from '@/components/ui/loading';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';

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

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>消费明细</CardTitle>
        <CardDescription>
          累计消费 ￥{balanceTotalConsume[0]}.{balanceTotalConsume[1]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SmoothTransition className="relative overflow-clip">
          <AnimatePresence>{!orderListData && <Loading motionKey="vines-consumer-details-loading" />}</AnimatePresence>
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
