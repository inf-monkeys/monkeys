import React from 'react';

import { Team } from '@/components/layout/settings/account/team';
import { TeamMember } from '@/components/layout/settings/account/team-member/TeamMember.tsx';
import { User } from '@/components/layout/settings/account/user';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <User />
        <Team />
        <TeamMember />
      </div>
      <div className="grid items-start gap-6"></div>
    </div>
  );
};
