import { BlockDefProperties } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

export enum CredentialAuthType {
  AKSK = 'AKSK',
  OAUTH2 = 'OAUTH2',
}

export interface IVinesCredentialType {
  id?: string;
  public: boolean;
  name: string;
  displayName: string;
  iconUrl?: string;
  properties: BlockDefProperties[];
  tokenScript: string;
  testConnectionScript?: string;
  type: CredentialAuthType;
}

export interface IVinesCredentialDetail {
  id?: string;
  type: string;
  displayName: string;
  data: { [x: string]: any };
}
