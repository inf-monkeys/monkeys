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

export type ITeamMember = {
  list: Array<IVinesUser & { _id: string }>;
  listTotal: number;
};

export type ITeamCreate = Pick<IVinesTeam, 'name' | 'description' | 'logoUrl'>;
