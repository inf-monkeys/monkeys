import React from 'react';

import { useTeams } from '@/apis/authz/team';
import { SettingsTeamHeader } from '@/components/layout/main/settings/team-header/index.lazy.tsx';
import { TeamMemberList } from '@/components/layout/main/settings/team-members/team-member-list.lazy.tsx';
import { SettingsWrapper } from '@/components/layout/main/settings/wrapper.tsx';
import { IUser } from '@/components/router/guard/auth.ts';
import { useLocalStorage } from '@/utils';

export const TeamMembersSettings: React.FC = () => {
  const { data: teams } = useTeams();
  const [user] = useLocalStorage<Partial<IUser>>('vines-account', {});

  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  return (
    <SettingsWrapper>
      <SettingsTeamHeader>
        <TeamMemberList currentTeam={currentTeam} user={user} />
      </SettingsTeamHeader>
    </SettingsWrapper>
  );
};
