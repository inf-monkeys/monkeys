import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import {
  ITeam,
  ITeamAppyUpdate,
  ITeamBalance,
  TeamInviteWithUserProfile,
  TeamMemberResponse,
} from '@/apis/authz/team/typings.ts';
import { authzPostFetcher, useAuthzGetFetcher, useAuthzPostFetcher } from '@/apis/fetcher.ts';

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

export const useGetTeamUsers = (teamId: string) =>
  useSWR<TeamMemberResponse>(`/api/teams/${teamId}/members`, useAuthzGetFetcher);

export const useRemoveTeamMember = (teamId: string) =>
  useSWRMutation(`/api/teams/${teamId}/members/remove`, useAuthzPostFetcher);

export const useGetTeamInvites = (teamId: string) =>
  useSWR<TeamInviteWithUserProfile[]>(`/api/teams/invites/manage/${teamId}`, useAuthzGetFetcher);

export const toggleTeamInviteStatus = (teamId: string, teamInviteId: string) =>
  authzPostFetcher<boolean, undefined>(`/api/teams/invites/manage/${teamId}/toggle/${teamInviteId}`, {
    arg: undefined,
  });

export const updateTeamInviteRemark = (teamId: string, teamInviteId: string, remark: string) =>
  authzPostFetcher<
    boolean,
    {
      remark: string;
    }
  >(`/api/teams/invites/manage/${teamId}/remark/${teamInviteId}`, { arg: { remark } });

export const deleteTeamInvite = (teamId: string, teamInviteId: string) =>
  authzPostFetcher<boolean, undefined>(`/api/teams/invites/manage/${teamId}/delete/${teamInviteId}`, {
    arg: undefined,
  });
