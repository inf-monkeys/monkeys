import React from 'react';

import { useTeamBalance } from '@/apis/authz/team';
import { Progress } from '@/components/ui/progress.tsx';
import { cn } from '@/utils';

interface IBalanceProps {
  max?: number;
}

export const Balance: React.FC<IBalanceProps> = ({ max = 1000 }) => {
  const { data: balance } = useTeamBalance();

  const finalBalance = balance?.amount ?? 0;
  const balanceInYuan = finalBalance / 100;
  const finalBalanceInPercent = balanceInYuan < max ? (balanceInYuan / max) * 100 : 100;

  return (
    <>
      <p className="text-xxs flex gap-1 opacity-85">
        余额 <span className="font-bold">￥{balanceInYuan.toFixed(2)}</span>
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
