import { ToolProperty } from '@inf-monkeys/monkeys';

export enum WorkflowTriggerType {
  // 手动
  MANUAL = 'MANUAL',
  // 定时
  SCHEDULER = 'SCHEDULER',
  // Webhook
  WEBHOOK = 'WEBHOOK',
}

export interface ITriggerType {
  type: WorkflowTriggerType;
  displayName: string;
  icon: string;
  description: string;
  workflowInputs?: ToolProperty[];
  properties?: ToolProperty[];
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

export interface IVinesWorkflowTriggerBasicAuthConfig {
  username: string;
  password: string;
}

export interface IVinesWorkflowTriggerCustomHeaderAuthConfig {
  headerKey: string;
  headerValue: string;
}

export interface IVinesWebhookTriggerConfig {
  method: WorkflowTriggerMethod;
  auth: WorkflowTriggerAuthType;
  basicAuthConfig?: IVinesWorkflowTriggerBasicAuthConfig;
  headerAuthConfig?: IVinesWorkflowTriggerCustomHeaderAuthConfig;
  responseUntil: WebhookTriggerResponseUntil;

  [x: string]: any;
}

export interface IVinesTrigger {
  createdTimestamp: number;
  enabled: boolean;
  cron?: string;
  isDeleted: boolean;
  type: WorkflowTriggerType;
  updatedTimestamp: number;
  workflowId: string;
  id: string;
  webhookPath?: string;
  webhookConfig?: IVinesWebhookTriggerConfig;
}

export interface IUpdateTriggerParams {
  type?: WorkflowTriggerType;
  enabled?: boolean;
  cron?: string;
  webhookConfig?: IVinesWebhookTriggerConfig;
}

export interface ICreateTriggerPragma extends Omit<IUpdateTriggerParams, 'enabled' | 'type'> {
  triggerType: WorkflowTriggerType | string;
  enabled: boolean;
  version: number;

  extraData?: { [x: string]: any };
}
