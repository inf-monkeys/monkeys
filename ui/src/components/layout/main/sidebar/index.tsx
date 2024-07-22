import React from 'react';

import { Account } from 'src/components/layout/main/sidebar/account';

import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { Toolbar } from '@/components/layout/main/sidebar/toolbar';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <VinesLogo className="h-auto max-h-20 [&>img]:w-[11.5rem]" disableInitialHeight />
      <NavList />
      <div className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-2 rounded-md bg-mauve-2 p-2 shadow-sm">
          <Account />
          <Separator />
          <Teams />
        </div>
        <Toolbar />
      </div>
    </div>
  );
};
