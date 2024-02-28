import React from 'react';

import { get } from 'lodash';
import { Account } from 'src/components/layout/main/sidebar/account';

import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { Toolbar } from '@/components/layout/main/sidebar/toolbar';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { AppLogo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  const { team } = useVinesTeam();
  const enabledCustomIcon = get(team, 'customTheme.enableTeamLogo', false);

  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      {team ? (
        <AppLogo className="w-auto" url={enabledCustomIcon ? team?.logoUrl : void 0} />
      ) : (
        <Skeleton className="h-8 w-full" />
      )}

      <NavList />
      <div className="flex flex-col gap-2">
        <Account />
        <Teams />
        <Toolbar />
      </div>
    </div>
  );
};
