import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import {
  ITeamAppyUpdate,
  ITeamBalance,
  ITeamMember,
  ITeamUpdate,
  IVinesTeam,
  TeamInviteWithUserProfile,
} from '@/apis/authz/team/typings.ts';
import { useAuthzGetFetcher, useAuthzPostFetcher } from '@/apis/fetcher.ts';
import { authzPostFetcher } from '@/apis/non-fetcher.ts';

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

export const useCreateTeamInviteLink = (teamId: string) =>
  useSWRMutation(`/api/teams/invites/${teamId}`, useAuthzPostFetcher);

export const useUpdateApplyTeam = (teamId: string) =>
  useSWRMutation<boolean, unknown, string, ITeamAppyUpdate>(`/api/teams/apply/${teamId}/update`, useAuthzPostFetcher);

export const useRemoveTeamMember = (teamId: string) =>
  useSWRMutation(`/api/teams/${teamId}/members/remove`, useAuthzPostFetcher);

export const useGetTeamInvites = (teamId: string) =>
  useSWR<TeamInviteWithUserProfile[]>(`/api/teams/invites/manage/${teamId}`, useAuthzGetFetcher);

// export const toggleTeamInviteStatus = (teamId: string, teamInviteId: string) =>
//   authzPostFetcher<boolean, undefined>(`/api/teams/invites/manage/${teamId}/toggle/${teamInviteId}`, {
//     arg: undefined,
//   });
//
// export const updateTeamInviteRemark = (teamId: string, teamInviteId: string, remark: string) =>
//   authzPostFetcher<
//     boolean,
//     {
//       remark: string;
//     }
//   >(`/api/teams/invites/manage/${teamId}/remark/${teamInviteId}`, { arg: { remark } });
//
// export const deleteTeamInvite = (teamId: string, teamInviteId: string) =>
//   authzPostFetcher<boolean, undefined>(`/api/teams/invites/manage/${teamId}/delete/${teamInviteId}`, {
//     arg: undefined,
//   });
