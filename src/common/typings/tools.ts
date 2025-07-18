import { AssetType, ToolProperty } from '@inf-monkeys/monkeys';

export interface ExtendedToolProperty extends ToolProperty {
  typeOptions?: {
    assetType?: AssetType;
    multipleValues?: boolean;
  };
}

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
  properties: ToolProperty[];
  iconUrl: string;
  type: CredentialAuthType;
}

export interface TriggerDefinition {
  description?: string;
  displayName: string;
  properties?: ToolProperty[];
  icon?: string;
  type: string;
  workflowInputs?: ToolProperty[];
}

export interface AuthConfig {
  type: AuthType;
  authorization_type?: 'bearer';
  verification_tokens?: { [x: string]: string };
}

export enum TriggerEndpointType {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface TriggerEndpointConfig {
  type: TriggerEndpointType;
  url: string;
  method: string;
}

export enum CredentialEndpointType {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface CredentialEndpointConfig {
  type: CredentialEndpointType;
  url: string;
  method: string;
}

export interface ToolRateLimiterConfig {
  maxConcurrentRequests: number;
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
  contact_email?: string;
  healthCheck?: string;
  triggerEndpoints?: TriggerEndpointConfig[];
  triggers?: TriggerDefinition[];
  credentials?: CredentialDefinition[];
  rsaPublicKey?: string;
  rateLimiter?: ToolRateLimiterConfig;
  logEndpoint?: string;
}

export enum ToolImportType {
  manifest = 'manifest',
  openapiSpec = 'openapiSpec',
  api = 'api',
}

export interface ToolApiDef {
  displayName: string;
  description: string;
  url: string;
  method: string;
  credentialPlaceAt: string;
  credentialKey: string;
  credentialValue: string;
  properties: ToolProperty[];
  output: ToolProperty[];
}

export interface RegisterToolParams {
  importType: ToolImportType;
  manifestUrl?: string;
  openapiSpecUrl?: string;
  namespace?: string;
  apiInfo?: ToolApiDef;
}

export interface RegisterToolOptions {
  isPublic?: boolean;
  userId?: string;
  teamId?: string;
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
  __advancedConfig: {
    outputAs?: 'json' | 'stream';
    timeout?: number;
  };

  credential?: {
    id: string;
    type: string;
    encryptedData: string;
  };

  [x: string]: any;
}
