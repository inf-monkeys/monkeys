import React, { useMemo, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { PaginationState } from '@tanstack/react-table';
import { Download } from 'lucide-react';

import { useTeamBalance, useTeamOrderList } from '@/apis/authz/team/payment';
import { columns } from '@/components/layout/settings/account/consumer-details/consts.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { RemoteDataTable } from '@/components/ui/data-table/remote.tsx';
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
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end p-6">
          <Button icon={<Download />} size="small">
            下载明细
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SmoothTransition>
          {orderListData ? (
            <RemoteDataTable
              columns={columns}
              data={orderListData.data ?? []}
              state={{ pagination }}
              rowCount={orderListData.total ?? 0}
              onPaginationChange={setPagination}
            />
          ) : (
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          )}
        </SmoothTransition>
      </CardContent>
    </Card>
  );
};
