import React from 'react';

import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { SidebarUser } from '@/components/layout/main/sidebar/user';
import { AppLogo } from '@/components/ui/logo';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <AppLogo />
      <NavList />
      <SidebarUser />
    </div>
  );
};
