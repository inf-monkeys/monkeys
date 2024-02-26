import React, { useEffect, useRef } from 'react';

import { useTeamBalance, useTeams } from '@/apis/authz/team';
import { useLocalStorage } from '@/utils';

export const TeamsGuard: React.FC = () => {
  const [token] = useLocalStorage<string>('vines-token', '', false);
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', '', false);
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
    if (!teams.find(({ id }) => id === teamId)) {
      setTeamId(teams[0].id);
      void teamBalanceMutate();
    }
  }, [teamId, teams]);

  return null;
};
