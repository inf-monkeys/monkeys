import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { useLocalStorage } from '@/utils';

const TeamsIdPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', '', false);
  const [, setLocalTeams] = useLocalStorage<IVinesTeam[]>('vines-teams', []);

  useEffect(() => {
    if (!teams) return;
    setLocalTeams(teams);
    void navigate({
      to: '/$teamId',
      params: {
        teamId: teamId ? teamId : teams[0].id,
      },
    });
  }, [teamId, teams]);

  return null;
};

export const Route = createFileRoute('/')({
  component: TeamsIdPage,
  beforeLoad: authGuard,
});
