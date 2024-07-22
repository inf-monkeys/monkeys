import React from 'react';

import { useSystemConfig } from '@/apis/common';
import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';

interface ITeamsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Teams: React.FC<ITeamsProps> = () => {
  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');

  return (
    <>
      <TeamSelector />
      {hasPayment && <Balance />}
    </>
  );
};
