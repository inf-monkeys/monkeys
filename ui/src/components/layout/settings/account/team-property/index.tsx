import React, { useMemo } from 'react';

import { CreditCard } from 'lucide-react';

import { useTeamBalance } from '@/apis/authz/team/payment';
import { Recharge } from '@/components/layout/settings/account/team-property/recharge';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface ITeamPropertyProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamProperty: React.FC<ITeamPropertyProps> = () => {
  const { data: balance } = useTeamBalance();

  const balanceAmount = useMemo<[string, string]>(() => {
    const { amount } = balance || {};
    return balanceFormat(amount);
  }, [balance]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>团队账户</CardTitle>
        <CardDescription>在此查看团队余额与明细</CardDescription>
      </CardHeader>
      <CardContent className="flex h-16 items-center">
        <div className="flex items-end">
          <div className="text-sm font-bold opacity-70">￥</div>
          <div className="text-xl font-bold leading-tight">{balanceAmount[0]}</div>
          <div className="text-sm font-bold">.{balanceAmount[1]}</div>
        </div>
        <div className="flex flex-1 justify-end">
          <Recharge>
            <Button size="small" icon={<CreditCard />} variant="outline">
              充值
            </Button>
          </Recharge>
        </div>
      </CardContent>
    </Card>
  );
};
