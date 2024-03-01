import { IUser } from '@/components/router/guard/auth.ts';

export interface ITeam {
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
  list: Array<IUser & { _id: string }>;
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
  acceptedUsers?: Partial<IUser>[];
  inviterUser?: Partial<IUser>;
  targetUser?: Partial<IUser>;
};
