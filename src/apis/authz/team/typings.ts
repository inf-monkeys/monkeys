import { IVinesUser } from '@/apis/authz/user/typings.ts';

export interface IVinesTeam {
  id: string;
  _id: string;
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

export interface ITeamBalance {
  amount: number;
  totalConsume: number;
  totalReCharge: number;
}

export type ITeamUpdate = Partial<Pick<IVinesTeam, 'name' | 'description' | 'logoUrl' | 'customTheme'>>;

export enum TeamInviteLinkOutdateType {
  SEVEN_DAYS = 1,
  NEVER = 2,
}

export interface ITeamAppyUpdate {
  disabled?: boolean;
  applyUserId?: string;
  apply?: boolean;
}

export enum TeamInviteType {
  INDIVIDUAL = 1,
  PUBLIC = 2,
}

export enum TeamInviteStatus {
  EFFECTIVE = 1,
  ACCEPTED = 2,
  DISABLED = 3,
}

export type TeamMemberResponse = {
  list: Array<IVinesUser & { _id: string }>;
  listTotal: number;
};

export type TeamInvite = {
  _id: string;
  inviterUserId: string;
  targetUserId?: string;
  teamId: string;
  type: TeamInviteType;
  status: TeamInviteStatus;
  outdateTimestamp: number;
  acceptedUserIds: string[];
  remark?: string;
  createdTimestamp: number;
};

export type TeamInviteWithUserProfile = TeamInvite & {
  acceptedUsers?: Partial<IVinesUser>[];
  inviterUser?: Partial<IVinesUser>;
  targetUser?: Partial<IVinesUser>;
};
