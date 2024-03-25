import { ApiType, AuthConfig, SchemaVersion } from '@/modules/tools/interfaces';
import { Column, Entity } from 'typeorm';
import url from 'url';
import { BaseEntity } from '../base/base';

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
}

export class ApiConfig {
  @Column({
    name: 'api_config',
  })
  type: ApiType;

  @Column({
    name: 'api_url',
  })
  url: string;
}

export const SYSTEM_NAMESPACE = 'system';

@Entity({ name: 'tools_server' })
export class ToolsServerEntity extends BaseEntity {
  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'base_url',
  })
  baseUrl: string;

  @Column({
    name: 'manifest_url',
    default: SchemaVersion.v1,
  })
  manifestUrl: string;

  @Column({
    name: 'schema_version',
    default: SchemaVersion.v1,
  })
  schemaVersion: SchemaVersion;

  @Column({
    name: 'namespace',
    unique: true,
  })
  namespace: string;

  @Column({
    type: 'simple-json',
  })
  auth: AuthConfig;

  @Column({
    type: 'simple-json',
  })
  api: ApiConfig;

  public getSpecUrl() {
    const {
      manifestUrl,
      api: { url: specUrl },
    } = this;
    let realSpecUrl = specUrl;
    if (!realSpecUrl.startsWith('http://') && !realSpecUrl.startsWith('https://')) {
      const parsedUrl = url.parse(manifestUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      realSpecUrl = url.resolve(baseUrl, realSpecUrl);
    }
    return realSpecUrl;
  }
}
