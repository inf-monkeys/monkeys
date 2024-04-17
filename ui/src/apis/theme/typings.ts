export interface ThemeCreate {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  secondaryBackgroundColor: string;
}

export interface Theme extends ThemeCreate {
  _id: string;
  teamId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  isEffective: boolean;
}

export interface ThemeMarket extends ThemeCreate {
  _id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  isPublic: true;
}
