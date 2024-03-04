import useSWR from 'swr';

import { ITeamBalance, ITeamCreate, ITeamMember, ITeamUpdate, IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useAuthzGetFetcher } from '@/apis/fetcher.ts';
import { authzDeleteFetcher, authzPostFetcher } from '@/apis/non-fetcher.ts';

export const useTeams = (enable = true) =>
  useSWR<IVinesTeam[]>(enable ? '/api/teams' : null, useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamBalance = () =>
  useSWR<ITeamBalance>('/api/payment/balances', useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateTeam = (team: ITeamUpdate) => authzPostFetcher<IVinesTeam, ITeamUpdate>(`/api/teams/update`, team);

export const useTeamUsers = (teamId: string | null) =>
  useSWR<ITeamMember>(teamId ? `/api/teams/${teamId}/members` : null, useAuthzGetFetcher);

export const removeTeamMember = (teamId: string, userId: string) =>
  authzPostFetcher<IVinesTeam, { userId: string }>(`/api/teams/${teamId}/members/remove`, { userId });

export const createTeam = (teamData: ITeamCreate) =>
  authzPostFetcher<boolean, ITeamCreate>(`/api/teams/create`, teamData);

export const deleteTeam = (teamId: string) => authzDeleteFetcher(`/api/teams/${teamId}`, {});

export const searchTeams = (keyword: string) =>
  authzPostFetcher<
    IVinesTeam[],
    {
      keyword: string;
    }
  >(`/api/teams/search`, { keyword });

export const applyTeam = (teamId: string) => authzPostFetcher<boolean, {}>(`/api/teams/apply/${teamId}`, {});
