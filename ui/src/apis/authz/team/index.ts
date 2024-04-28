import useSWR from 'swr';

import FileSaver from 'file-saver';
import _ from 'lodash';

import {
  IExportTeamOptions,
  IInviteTeamData,
  ITeamApplyListData,
  ITeamApplyUpdateData,
  ITeamCreate,
  ITeamInviteLinkData,
  ITeamInviteWithUserProfile,
  ITeamMember,
  ITeamUpdate,
  IVinesTeam,
} from '@/apis/authz/team/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useTeams = (enable = true) =>
  useSWR<IVinesTeam[] | undefined>(enable ? '/api/teams' : null, vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateTeam = (team: ITeamUpdate) =>
  vinesFetcher<IVinesTeam, ITeamUpdate>({ method: 'POST', simple: true })('/api/teams/update', team);

export const useTeamUsers = (teamId?: string) =>
  useSWR<ITeamMember | undefined>(teamId ? `/api/teams/${teamId}/members` : null, vinesFetcher());

export const removeTeamMember = (teamId: string, userId: string) =>
  vinesFetcher<IVinesTeam>({ method: 'POST', simple: true })(`/api/teams/${teamId}/members/remove`, { userId });

export const createTeam = (teamData: ITeamCreate) =>
  vinesFetcher<boolean, ITeamCreate>({ method: 'POST', simple: true })(`/api/teams`, teamData);

export const deleteTeam = (teamId: string) => vinesFetcher({ method: 'DELETE' })(`/api/teams/${teamId}`);

export const searchTeams = (keyword: string) =>
  vinesFetcher<
    IVinesTeam[],
    {
      keyword: string;
    }
  >({ method: 'POST', simple: true })(`/api/teams/search`, { keyword });

export const makeJoinTeamRequest = (teamId: string) =>
  vinesFetcher<boolean>({ method: 'POST', simple: true })(`/api/teams/${teamId}/join-requests`);

export const useTeamJoinRequests = (teamId?: string) =>
  useSWR<ITeamApplyListData | undefined>(teamId ? `/api/teams/${teamId}/join-requests` : null, vinesFetcher());
// export const getTeamApplyList = (teamId: string) => vinesFetcher<ITeamApplyListData>()(`/api/teams/apply/${teamId}`);

export const updateTeamApply = (data: ITeamApplyUpdateData & { teamId: string }) =>
  vinesFetcher<boolean, ITeamApplyUpdateData>({ method: 'POST', simple: true })(
    `/api/teams/apply/${data.teamId}/update`,
    _.omit(data, ['teamId']) as ITeamApplyUpdateData,
  );

export const createTeamInviteLink = (data: ITeamInviteLinkData & { teamId: string }) =>
  vinesFetcher<string, ITeamInviteLinkData>({
    method: 'POST',
    simple: true,
  })(`/api/teams/invites/${data.teamId}`, _.omit(data, ['teamId']) as ITeamInviteLinkData);

export const useTeamInvites = (teamId?: string) =>
  useSWR<ITeamInviteWithUserProfile[] | undefined>(
    teamId ? `/api/teams/invites/manage/${teamId}` : null,
    vinesFetcher(),
  );

export const updateTeamInviteRemark = (teamId: string, teamInviteId: string, remark: string) =>
  vinesFetcher<boolean, { remark: string }>({
    method: 'POST',
    simple: true,
  })(`/api/teams/invites/manage/${teamId}/remark/${teamInviteId}`, { remark });

export const toggleTeamInviteStatus = (teamId: string, teamInviteId: string) =>
  vinesFetcher<boolean>({ method: 'POST' })(`/api/teams/invites/manage/${teamId}/toggle/${teamInviteId}`);

export const deleteTeamInvite = (teamId: string, teamInviteId: string) =>
  vinesFetcher<boolean>({ method: 'POST' })(`/api/teams/invites/manage/${teamId}/delete/${teamInviteId}`);

export const exportTeam = async (teamId: string, teamName: string, options: IExportTeamOptions) => {
  await vinesFetcher({
    method: 'POST',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(await r.blob(), `${teamName}.zip`);
    },
  })(`/api/export-tenant-assets/${teamId}`, options);
};

export const useInviteTeam = (inviteId: string) =>
  useSWR<IInviteTeamData | undefined>(`/api/teams/invites/${inviteId}`, vinesFetcher());

export const acceptTeamInvite = (inviteId: string) =>
  vinesFetcher<boolean>({ method: 'POST', simple: true })(`/api/teams/invites/${inviteId}/accept`, {});
