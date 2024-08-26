/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import { useCreation, useMemoizedFn } from 'ahooks';
import { isArray } from 'lodash';

import { useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useSystemConfig } from '@/apis/common';
import { useLocalStorage } from '@/hooks/use-local-storage';

export const TeamsGuard: React.FC = () => {
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();

  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');

  const [token] = useLocalStorage<string>('vines-token', '', false);
  const { teamId } = useVinesTeam();
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
      localStorage.setItem('vines-team-id', latestTeamId);
      window['vinesTeamId'] = latestTeamId;
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

export const getVinesTeamId = () => {
  const windowTeamId = window['vinesTeamId'];
  if (!windowTeamId) {
    const localTeamId = localStorage.getItem('vines-team-id');
    if (localTeamId) {
      window['vinesTeamId'] = localTeamId;
    }
    return localTeamId;
  }
  return windowTeamId;
};

export const useVinesTeam = () => {
  const [localTeams, setLocalTeams] = useLocalStorage<IVinesTeam[]>('vines-teams', []);

  const windowTeamId = window['vinesTeamId'];
  const [localTeamId, setLocalTeamId] = useLocalStorage<string>('vines-team-id', windowTeamId, false);

  const teamId = windowTeamId || localTeamId;

  const { data } = useTeams(!teamId && !localTeams.length);
  useEffect(() => {
    if (data) {
      setLocalTeams(data);
    }
  }, [data]);

  const teams = data ?? localTeams ?? [];
  const team = useCreation(
    () => ((isArray(teams) ? teams : []) ?? [])?.find((team) => team.id === teamId),
    [teamId, teams],
  );

  const isTeamOwner = useMemoizedFn((userId: string) => team?.ownerUserId === userId);

  const setTeamId = useMemoizedFn((id: string) => {
    setLocalTeamId(id);
    window['vinesTeamId'] = id;
  });

  return {
    team,
    teamId,
    teams,
    setTeamId,
    setLocalTeams,
    isTeamOwner,
  };
};
