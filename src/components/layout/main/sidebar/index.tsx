import React from 'react';

import { get } from 'lodash';
import { Account } from 'src/components/layout/main/sidebar/account';

import { useTeams } from '@/apis/authz/team';
import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { Toolbar } from '@/components/layout/main/sidebar/toolbar';
import { AppLogo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLocalStorage } from '@/utils';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);
  const enabledCustomIcon = get(currentTeam, 'customTheme.enableTeamLogo', false);

  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      {currentTeam ? (
        <AppLogo className="w-auto" url={enabledCustomIcon ? currentTeam?.logoUrl : void 0} />
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
