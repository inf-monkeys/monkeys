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
