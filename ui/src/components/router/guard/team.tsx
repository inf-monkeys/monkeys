/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import { useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useSystemConfig } from '@/apis/common';
import { useLocalStorage } from '@/utils';

export const TeamsGuard: React.FC = () => {
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();

  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');

  const [token] = useLocalStorage<string>('vines-token', '', false);
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', '', false);
  const [, setLocalTeams] = useLocalStorage<IVinesTeam[]>('vines-teams', []);
  const { data: teams, mutate: teamsMutate } = useTeams(!!token);

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
      }).then(() => hasPayment && mutate('/api/payment/balances'));
    }
  }, [teamId, teams]);

  useEffect(() => {
    if (!teamId) return;
    // 切换团队后刷新数据
    void mutate(
      (key: unknown) => {
        if (typeof key !== 'string') return false;
        if (!hasPayment && key.startsWith('/api/payment/balances')) {
          return false;
        }

        return (key as string).startsWith('/api');
      },
      void 0,
      {
        revalidate: true,
      },
    );
  }, [teamId]);

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
