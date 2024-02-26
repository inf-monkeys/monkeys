import useSWR from 'swr';

import { ITeam, ITeamBalance } from '@/apis/authz/team/typings.ts';
import { useAuthzGetFetcher } from '@/apis/fetcher.ts';

export const useTeams = (enable = true) =>
  useSWR<ITeam[]>(enable ? '/api/teams' : null, useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamBalance = () =>
  useSWR<ITeamBalance>('/api/payment/balances', useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });
