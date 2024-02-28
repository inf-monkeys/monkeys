import React from 'react';

import { useTeams } from '@/apis/authz/team';
import { SettingsHeader } from '@/pages/$teamId/settings/header.lazy.tsx';
import { useLocalStorage } from '@/utils';

interface ISettingsUserHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  readonly?: boolean;
  buttons?: React.ReactNode;
}

export const SettingsTeamHeader: React.FC<ISettingsUserHeaderProps> = ({ readonly = false, buttons, children }) => {
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  return (
    <>
      <SettingsHeader
        avatarUrl={currentTeam?.logoUrl}
        name={currentTeam?.name}
        desc={currentTeam?.description}
        buttons={buttons}
      >
        {children}
      </SettingsHeader>
    </>
  );
};
