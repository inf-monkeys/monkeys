import React from 'react';

import { Users } from '@/components/layout/main/sidebar/account/users';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => (
  <>
    <Users />
  </>
);
