import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum ApikeyUsageType {
  ChatCompletions = 'chat_completions',
  Completions = 'completions',
  WORKFLOW = 'workflow',
}

export interface ApiKeyUsageLLMInfo {
  modelName: string;
  tokenCount: number;
}

export interface ApiKeyUsageWorkflowInfo {
  workflowId: string;
  tokenCount: number;
}

export type ApiKeyUsageExtraInfo = ApiKeyUsageLLMInfo | ApiKeyUsageWorkflowInfo;

@Entity({ name: 'apikey_usage' })
@Index(['teamId', 'apiKey'])
export class ApiKeyUsageEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'api_key',
  })
  apiKey: string;

  @Column({
    name: 'usage_type',
    type: 'varchar',
  })
  usageType: ApikeyUsageType;

  @Column({
    name: 'extra_info',
    nullable: true,
    type: 'simple-json',
  })
  extraInfo: ApiKeyUsageExtraInfo;
}
