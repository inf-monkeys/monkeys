import { AssetType } from '@/common/typings/asset';
import { BlockDefProperties, MonkeyTaskDefTypes } from '@inf-monkeys/vines';
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
  variables?: BlockDefProperties[];

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
}
