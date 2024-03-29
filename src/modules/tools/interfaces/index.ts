import { BlockDefProperties } from '@inf-monkeys/vines';

export enum AuthType {
  none = 'none',
  service_http = 'service_http',
}

export enum ApiType {
  openapi = 'openapi',
}

export enum SchemaVersion {
  v1 = 'v1',
}

export enum CredentialAuthType {
  AKSK = 'AKSK',
  OAUTH2 = 'OAUTH2',
}

export interface CredentialDefinition {
  name: string;
  displayName: string;
  description?: string;
  properties: BlockDefProperties[];
  icon: string;
  type: CredentialAuthType;
}

export interface AuthConfig {
  type: AuthType;
  authorization_type?: 'bearer';
  verification_tokens?: { [x: string]: string };
}

export interface ManifestJson {
  schema_version: SchemaVersion;
  display_name: string;
  namespace: string;
  auth: AuthConfig;
  api: {
    type: ApiType;
    url: string;
  };
  contact_email: string;
  credentials?: CredentialDefinition[];
  credentialEncryptKey?: string;
}

export interface RegisterWorkerParams {
  manifestUrl: string;
}

export interface WorkerInputData {
  __toolName: string;
  __apiInfo: {
    method: string;
    path: string;
  };
  __context: {
    appId: string;
    userId: string;
    teamId: string;
  };

  [x: string]: any;
}
