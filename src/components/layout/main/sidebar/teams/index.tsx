import React from 'react';

import { useSystemConfig } from '@/apis/common';
import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';

interface ITeamsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Teams: React.FC<ITeamsProps> = () => {
  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');

  return (
    <div className="flex w-full flex-col gap-2 rounded-md bg-mauve-2 p-2 shadow-sm">
      <TeamSelector />
      {hasPayment && <Balance />}
    </div>
  );
};
