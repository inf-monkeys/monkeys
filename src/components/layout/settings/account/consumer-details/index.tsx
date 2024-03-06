import React, { useMemo } from 'react';

import { Download } from 'lucide-react';

import { useTeamBalance } from '@/apis/authz/team/payment';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IConsumerDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ConsumerDetails: React.FC<IConsumerDetailsProps> = () => {
  const { data: balance } = useTeamBalance();

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
    </Card>
  );
};
