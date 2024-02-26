import React from 'react';

import { Account } from 'src/components/layout/main/sidebar/account';

import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { AppLogo } from '@/components/ui/logo';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <AppLogo />
      <NavList />
      <Account />
      <Teams />
    </div>
  );
};
