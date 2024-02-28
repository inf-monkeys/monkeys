import React, { useEffect, useMemo, useRef } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTeamBalance, useTeams } from '@/apis/authz/team';
import { ITeam } from '@/apis/authz/team/typings.ts';
import { useLocalStorage } from '@/utils';

export const TeamsGuard: React.FC = () => {
  const navigate = useNavigate();

  const [token] = useLocalStorage<string>('vines-token', '', false);
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', '', false);
  const [, setLocalTeams] = useLocalStorage<ITeam[]>('vines-teams', []);
  const { data: teams, mutate: teamsMutate } = useTeams(!!token);
  const { mutate: teamBalanceMutate } = useTeamBalance();

  const lastTokenRef = useRef('');
  useEffect(() => {
    if (lastTokenRef.current !== token && token) {
      if (lastTokenRef.current) {
        void teamsMutate();
      }
      lastTokenRef.current = token;
    }
  }, [token]);

  useEffect(() => {
    if (!teams) return;
    setLocalTeams(teams);
    if (!teams.find(({ id }) => id === teamId)) {
      const latestTeamId = teams[0].id;
      setTeamId(latestTeamId);
      void navigate({
        to: '/$teamId',
        params: {
          teamId: latestTeamId,
        },
      });
      void teamBalanceMutate();
    }
  }, [teamId, teams]);

  return null;
};

export const useVinesTeam = () => {
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const getTeamId = () => useMemo(() => teamId, [teamId]);

  const team = useMemo(() => (teams ?? []).find((team) => team.id === teamId), [teamId, teams]);

  return {
    getTeamId,
    team,
    teamId,
    teams,
  };
};
