import React from 'react';

import { User } from '@/components/layout/settings/account/user';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  return (
    <div className="grid grid-cols-3 items-start justify-center gap-6">
      <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
        <User />
      </div>
      <div className="col-span-2 grid items-start gap-6 lg:col-span-1"></div>
    </div>
  );
};
