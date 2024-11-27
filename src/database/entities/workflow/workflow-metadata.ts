import { AssetType, MonkeyTaskDefTypes, ToolProperty } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../assets/base-asset';
import { WorkflowTriggerType } from './workflow-trigger';

export enum ValidationIssueType {
  ERROR = 'ERROR',
  WANRING = 'WANRING',
}

export enum ValidationReasonType {
  VALUE_REQUIRED = 'VALUE_REQUIRED',
  INALID_VALUE = 'INALID_VALUE',
  VALUE_TYPE_NOT_MATCH = 'VALUE_TYPE_NOT_MATCH',
  DO_WHILE_EMPTY_LOOP_OVER = 'DO_WHILE_EMPTY_LOOP_OVER',
  CODE_INVALID_MODULE = 'CODE_INVALID_MODULE',
  REFERENCED_UNKNOWN_TASK = 'REFERENCED_UNKNOWN_TASK',
  MISSING_CREDENTIAL = 'MISSING_CREDENTIAL',
  SUB_WORKFLOW_PARAM_MISSING = 'SUB_WORKFLOW_PARAM_MISSING',
  SUB_WORKFLOW_NAME_MISSING = 'SUB_WORKFLOW_NAME_MISSING',
}

export interface ValidationIssueReson {
  type: ValidationReasonType;
  name: string;
  detailInfomation?: { [x: string]: any };
}

export interface WorkflowValidationIssue {
  taskReferenceName: string;
  issueType: ValidationIssueType;
  detailReason: ValidationIssueReson;
  humanMessage: {
    en: string;
    zh: string;
  };
}

export interface WorkflowTriggerConfig {
  triggerType: WorkflowTriggerType;
  cron?: string;
}

export interface WorkflowOutputValue {
  key: string;
  value: string;
}

export interface WorkflowRateLimiter {
  enabled: boolean;
  windowMs: number;
  max: number;
}

@Entity({ name: 'workflow_metadatas' })
export class WorkflowMetadataEntity extends BaseAssetEntity {
  assetType: AssetType = 'workflow';
  public getAssetId() {
    return this.workflowId;
  }

  @Column({
    name: 'workflow_id',
  })
  workflowId: string;

  @Column()
  version: number;

  /**
   * 工作流是否成功激活，非激活状态的工作流不允许执行
   *
   */
  @Column({
    default: true,
  })
  activated?: boolean;

  @Column({
    default: true,
  })
  validated?: boolean;

  @Column({
    nullable: true,
    comment: 'conductor workflow json 定义',
    type: 'simple-json',
    name: 'tasks',
  })
  tasks: MonkeyTaskDefTypes[];

  @Column({
    comment: 'workflow 变量',
    type: 'simple-json',
    nullable: true,
  })
  variables?: ToolProperty[];

  @Column({
    comment: 'workflow output 配置',
    type: 'simple-json',
    nullable: true,
  })
  output: WorkflowOutputValue[];

  @Column({
    nullable: true,
    comment: 'fork from',
    name: 'fork_from_id',
  })
  forkFromId?: string;

  @Column({
    nullable: true,
    comment: '工作流校验错误/警告',
    type: 'simple-json',
    name: 'validation_issues',
  })
  validationIssues?: WorkflowValidationIssue[];

  @Column({
    nullable: true,
  })
  md5?: string;

  @Column({
    nullable: true,
    default: false,
  })
  hidden?: boolean;

  @Column({
    name: 'rate_limiter',
    type: 'simple-json',
    nullable: true,
  })
  rateLimiter: WorkflowRateLimiter;

  @Column({
    name: 'expose_openai_compatible_interface',
    default: false,
  })
  exposeOpenaiCompatibleInterface: boolean;

  @Column({
    name: 'openai_model_name',
    nullable: true,
  })
  openaiModelName: string;

  @Column({
    name: 'not_authorized',
    nullable: true,
    default: false,
  })
  notAuthorized?: boolean;

  @Column({
    type: 'text',
    name: 'shortcuts_flow',
    nullable: true,
  })
  shortcutsFlow?: string;

  @Column({
    nullable: true,
    default: false,
    type: 'varchar',
  })
  thumbnail?: string;

  public isRateLimitEnabled() {
    return this.rateLimiter?.enabled;
  }
}
