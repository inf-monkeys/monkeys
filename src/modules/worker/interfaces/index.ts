export enum AuthType {
  none = 'none',
}

export enum ApiType {
  openapi = 'openapi',
}

export enum SchemaVersion {
  v1 = 'v1',
}

export interface ManifestJson {
  schema_version: SchemaVersion;
  namespace: string;
  auth: {
    type: AuthType;
  };
  api: {
    type: ApiType;
    url: string;
  };
  contact_email: string;
}

export interface RegisterWorkerParams {
  manifestJsonUrl: string;
}

export interface WorkerInputData {
  __blockName: string;

  [x: string]: any;
}
