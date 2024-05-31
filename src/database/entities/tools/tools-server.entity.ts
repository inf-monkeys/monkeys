import { ApiType, AuthConfig, CredentialEndpointConfig, SchemaVersion, ToolRateLimiterConfig, TriggerEndpointConfig } from '@/common/typings/tools';
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
export const API_NAMESPACE = 'api';

export enum HealthCheckStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

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

  @Column({
    type: 'simple-json',
    name: 'trigger_endpoints',
    nullable: true,
  })
  triggerEndpoints: TriggerEndpointConfig[];

  @Column({
    type: 'simple-json',
    name: 'credential_endpoints',
    nullable: true,
  })
  credentialEndpoints: CredentialEndpointConfig[];

  @Column({
    type: 'simple-json',
    name: 'rate_limiter',
    nullable: true,
  })
  rateLimiter?: ToolRateLimiterConfig;

  @Column({
    name: 'health_check',
    nullable: true,
  })
  heatlhCheck?: string;

  @Column({
    name: 'health_check_status',
    nullable: true,
  })
  healthCheckStatus?: HealthCheckStatus;

  @Column({
    name: 'log_endpoint',
    nullable: true,
  })
  logEndpoint?: string;

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

  public getHealthCheckUrl() {
    const { manifestUrl, heatlhCheck } = this;
    let realHealthCheckUrl = heatlhCheck;
    if (!realHealthCheckUrl.startsWith('http://') && !realHealthCheckUrl.startsWith('https://')) {
      const parsedUrl = url.parse(manifestUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      realHealthCheckUrl = url.resolve(baseUrl, realHealthCheckUrl);
    }
    return realHealthCheckUrl;
  }
}
