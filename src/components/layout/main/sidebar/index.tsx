import React from 'react';

import { get } from 'lodash';
import { Account } from 'src/components/layout/main/sidebar/account';

import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { Toolbar } from '@/components/layout/main/sidebar/toolbar';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { AppLogo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { cn } from '@/utils';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  const { team } = useVinesTeam();
  const enabledCustomIcon = get(team, 'customTheme.enableTeamLogo', false);

  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <SmoothTransition initialHeight={72.2}>
        {team ? (
          <AppLogo className="w-auto" url={enabledCustomIcon ? team?.logoUrl : void 0} />
        ) : (
          <Skeleton className={cn('h-[72.2px] w-full', enabledCustomIcon && 'h-8')} />
        )}
      </SmoothTransition>

      <NavList />
      <div className="flex flex-col gap-2">
        <Account />
        <Teams />
        <Toolbar />
      </div>
    </div>
  );
};
