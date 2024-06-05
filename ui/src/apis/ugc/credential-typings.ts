import { BlockDefPropertiesExtended } from '@/apis/tools/typings.ts';

export enum ICredentialAuthType {
  AKSK = 'AKSK',
  OAUTH2 = 'OAUTH2',
}

export interface ICredentialType {
  id?: string;
  public: boolean;
  name: string;
  displayName: string;
  logo?: string;
  properties: BlockDefPropertiesExtended[];
  tokenScript: string;
  testConnectionScript?: string;
  type: ICredentialAuthType;
}

export interface ICredentialDetail {
  id?: string;
  type: string;
  displayName: string;
  data: { [x: string]: any };
}
