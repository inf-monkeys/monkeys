import React, { useMemo } from 'react';

import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTeamBalance } from '@/apis/authz/team/payment';
import { Recharge } from '@/components/layout/settings/account/team-property/recharge';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface ITeamPropertyProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamProperty: React.FC<ITeamPropertyProps> = () => {
  const { t } = useTranslation();

  const { data: balance } = useTeamBalance();

  const balanceAmount = useMemo<[string, string]>(() => {
    const { amount } = balance || {};
    return balanceFormat(amount);
  }, [balance]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.payment.property.title')}</CardTitle>
        <CardDescription>{t('settings.payment.property.desc')}</CardDescription>
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
              {t('settings.payment.property.button')}
            </Button>
          </Recharge>
        </div>
      </CardContent>
    </Card>
  );
};
