import React from 'react';

import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';

interface ITeamsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Teams: React.FC<ITeamsProps> = () => {
  return (
    <div className="flex w-full flex-col gap-2 rounded-md bg-mauve-2 p-2 shadow-sm">
      <TeamSelector />
      <Balance />
    </div>
  );
};
