import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum WorkflowTriggerType {
  // 手动
  MANUALLY = 'MANUAL',
  // 定时
  SCHEDULER = 'SCHEDULER',
  // Webhook
  WEBHOOK = 'WEBHOOK',
}

export enum WorkflowTriggerMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

export enum WorkflowTriggerAuthType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  CUSTOM_HEADER = 'CUSTOM_HEADER',
}

export enum WebhookTriggerResponseUntil {
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED_OR_FINISHED = 'WORKFLOW_COMPLETED_OR_FINISHED',
}

export interface WorkflowTriggerBasicAuthConfig {
  username: string;
  password: string;
}

export interface WorkflowTriggerCustomHeaderAuthConfig {
  headerKey: string;
  headerValue: string;
}

export interface WebhookTriggerConfig {
  method: WorkflowTriggerMethod;
  auth: WorkflowTriggerAuthType;
  basicAuthConfig?: WorkflowTriggerBasicAuthConfig;
  headerAuthConfig?: WorkflowTriggerCustomHeaderAuthConfig;
  responseUntil: WebhookTriggerResponseUntil;
}

@Entity({ name: 'workflow-triggers' })
export class WorkflowTriggersEntity extends BaseEntity {
  @Column({
    name: 'workflow_id',
  })
  workflowId: string;

  @Column({
    name: 'workflow_version',
  })
  workflowVersion: number;

  @Column()
  type: WorkflowTriggerType;

  @Column()
  enabled: boolean;

  /**
   * 定时任务具备的参数
   */
  @Column()
  cron?: string;

  @Column({
    name: 'next_trigger_time',
  })
  nextTriggerTime?: number;

  @Column({
    name: 'last_trigger_time',
  })
  lastTriggerTime?: number;

  /**
   * Webhook 触发器具备的参数
   */
  @Column({
    name: 'webhook_path',
  })
  webhookPath?: string;

  @Column({
    name: 'workflow_config',
    type: 'simple-json',
  })
  webhookConfig?: WebhookTriggerConfig;
}
