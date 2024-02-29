import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { ITeam, ITeamAppyUpdate, ITeamBalance } from '@/apis/authz/team/typings.ts';
import { useAuthzGetFetcher, useAuthzPostFetcher } from '@/apis/fetcher.ts';

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

export const useCreateTeamInviteLink = (teamId: string) =>
  useSWRMutation(`/api/teams/invites/${teamId}`, useAuthzPostFetcher);

export const useUpdateApplyTeam = (teamId: string) =>
  useSWRMutation<boolean, unknown, string, ITeamAppyUpdate>(`/api/teams/apply/${teamId}/update`, useAuthzPostFetcher);
