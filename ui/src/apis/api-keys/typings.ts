export enum IApiKeyStatus {
  Valid = 'valid',
  Revoked = 'revoked',
}

export interface IApiKey {
  id: string;
  teamId: string;
  creatorUserId: string;
  apiKey: string;
  status: IApiKeyStatus;
  desc?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}
