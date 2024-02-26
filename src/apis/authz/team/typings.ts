export interface ITeam {
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

export interface ITeamBalance {
  amount: number;
  totalConsume: number;
  totalReCharge: number;
}
