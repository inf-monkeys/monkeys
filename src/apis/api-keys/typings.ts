export enum ApiKeyStatus {
  Valid = 'valid',
  Revoked = 'revoked',
}

export interface IApiKey {
  _id: string;
  teamId: string;
  creatorUserId: string;
  apiKey: string;
  status: ApiKeyStatus;
  desc?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}
