import { IVinesUser } from '@/apis/authz/user/typings.ts';

export interface IVinesTeam {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  ownerUserId?: string;
  customTheme?: {
    enableTeamLogo?: boolean;
    primaryColor?: string;
    backgroundColor?: string;
    secondaryBackgroundColor?: string;
  };
}

export type ITeamUpdate = Partial<Pick<IVinesTeam, 'name' | 'description' | 'logoUrl' | 'customTheme'>>;

export type ITeamMember = {
  list: Array<IVinesUser>;
  listTotal: number;
};

export type ITeamCreate = Pick<IVinesTeam, 'name' | 'description' | 'logoUrl'>;

export interface ITeamApplyListData {
  id: string;
  teamId: string;
  applyList: string[];
  applyUserList?: IVinesUser[];
  disable: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface ITeamApplyUpdateInfoData {
  disabled: boolean;
}

export interface ITeamApplyUpdateApplyData {
  applyUserId: string;
  apply: boolean;
}

export type ITeamApplyUpdateData = ITeamApplyUpdateInfoData | ITeamApplyUpdateApplyData;

export enum ITeamInviteLinkOutdateType {
  SEVEN_DAYS = 1,
  NEVER = 2,
}

export interface ITeamInviteLinkData {
  inviterUserId: string;
  outdateType: ITeamInviteLinkOutdateType;
  targetUserId?: string;
}

export enum ITeamInviteType {
  INDIVIDUAL = 1,
  PUBLIC = 2,
}

export enum ITeamInviteStatus {
  EFFECTIVE = 1,
  ACCEPTED = 2,
  DISABLED = 3,
}

export type ITeamInvite = {
  id: string;
  inviterUserId: string;
  targetUserId?: string;
  teamId: string;
  type: ITeamInviteType;
  status: ITeamInviteStatus;
  outdateTimestamp: number;
  acceptedUserIds: string[];
  remark?: string;
  createdTimestamp: number;
};

export type ITeamInviteWithUserProfile = ITeamInvite & {
  acceptedUsers?: Partial<IVinesUser>[];
  inviterUser?: Partial<IVinesUser>;
  targetUser?: Partial<IVinesUser>;
};

export interface IExportTeamOptions {
  exportWorkflows: boolean;
  exportSqlTables: boolean;
  exportVectorDatabases: boolean;
  exportRichMedias: boolean;
}
