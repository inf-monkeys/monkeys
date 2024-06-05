export interface ThemeCreate {
  name: string;
  primaryColor: string;
}

export interface Theme extends ThemeCreate {
  id: string;
  teamId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  isEffective: boolean;
}

export interface ThemeMarket extends ThemeCreate {
  id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  isPublic: true;
}
