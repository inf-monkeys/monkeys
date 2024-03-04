import useSWR from 'swr';

import { ITeamBalance, ITeamMember, ITeamUpdate, IVinesTeam } from '@/apis/authz/team/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useTeams = (enable = true) =>
  useSWR<IVinesTeam[]>(enable ? '/api/teams' : null, vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamBalance = () =>
  useSWR<ITeamBalance>('/api/payment/balances', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateTeam = (team: ITeamUpdate) =>
  vinesFetcher<IVinesTeam, ITeamUpdate>({ method: 'POST' })('/api/teams/update', team);

export const useTeamUsers = (teamId: string | null) =>
  useSWR<ITeamMember>(teamId ? `/api/teams/${teamId}/members` : null, vinesFetcher());

export const removeTeamMember = (teamId: string, userId: string) =>
  vinesFetcher<IVinesTeam>({ method: 'POST' })(`/api/teams/${teamId}/members/remove`, { userId });
