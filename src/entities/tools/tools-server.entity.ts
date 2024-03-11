import { ApiType, AuthType, SchemaVersion } from '@/modules/tools/interfaces';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
}

export class AuthConfig {
  @Column({
    name: 'auth_type',
  })
  type: AuthType;
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

@Entity({ name: 'tools_server' })
export class ToolsServerEntity extends BaseEntity {
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
}
