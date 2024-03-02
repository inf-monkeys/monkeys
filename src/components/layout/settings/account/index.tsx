import React from 'react';

import { Team } from '@/components/layout/settings/account/team';
import { User } from '@/components/layout/settings/account/user';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  return (
    <div className="grid grid-cols-3 items-start justify-center gap-4">
      <div className="col-span-2 grid items-start gap-4 lg:col-span-1">
        <User />
        <Team />
      </div>
      <div className="col-span-2 grid items-start gap-6 lg:col-span-1"></div>
      <div className="col-span-2 grid items-start gap-6 lg:col-span-1"></div>
    </div>
  );
};
