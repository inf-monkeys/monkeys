/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTeamBalance, useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useLocalStorage } from '@/utils';

export const TeamsGuard: React.FC = () => {
  const navigate = useNavigate();

  const [token] = useLocalStorage<string>('vines-token', '', false);
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', '', false);
  const [, setLocalTeams] = useLocalStorage<IVinesTeam[]>('vines-teams', []);
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
      navigate({
        params: {
          teamId: latestTeamId,
        },
      }).then(() => teamBalanceMutate());
    }
  }, [teamId, teams]);

  return null;
};

export const useVinesTeam = () => {
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const team = useMemo(() => (teams ?? []).find((team) => team.id === teamId), [teamId, teams]);

  const isTeamOwner = (userId: string) => team?.ownerUserId === userId;

  return {
    team,
    teamId,
    teams,
    isTeamOwner,
  };
};
