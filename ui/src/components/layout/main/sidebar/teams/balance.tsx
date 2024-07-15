import React from 'react';

import { useTranslation } from 'react-i18next';

import { useTeamBalance } from '@/apis/authz/team/payment';
import { Progress } from '@/components/ui/progress.tsx';
import { cn } from '@/utils';

interface IBalanceProps {
  max?: number;
}

export const Balance: React.FC<IBalanceProps> = ({ max = 1000 }) => {
  const { t } = useTranslation();

  const { data: balance } = useTeamBalance();

  const finalBalance = balance?.amount ?? 0;
  const balanceInYuan = finalBalance / 100;
  const finalBalanceInPercent = balanceInYuan < max ? (balanceInYuan / max) * 100 : 100;

  return (
    <>
      <p className="flex gap-1 text-xs opacity-85">
        {t('components.layout.main.sidebar.teams.balance')}{' '}
        <span className="font-bold">￥{balanceInYuan.toFixed(2)}</span>
      </p>
      <Progress
        value={finalBalanceInPercent}
        className={cn({
          'bg-green-10/10': finalBalanceInPercent > 80,
          'bg-yellow-10/10': finalBalanceInPercent <= 80 && finalBalanceInPercent > 40,
          'bg-red-10/10': finalBalanceInPercent <= 40,
        })}
        indicatorClassName={cn({
          'bg-green-10': finalBalanceInPercent > 80,
          'bg-yellow-10': finalBalanceInPercent <= 80 && finalBalanceInPercent > 40,
          'bg-red-10': finalBalanceInPercent <= 40,
        })}
      />
    </>
  );
};
