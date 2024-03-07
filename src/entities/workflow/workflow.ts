import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';
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

@Entity({ name: 'workflows' })
export class WorkflowMetadataEntity extends BaseEntity {
  @Column()
  workflowId: string;

  @Column()
  version: number;

  @Column()
  name: string;

  @Column()
  desc?: string;

  @Column()
  logo?: string;

  /**
   * 工作流是否成功激活，非激活状态的工作流不允许执行
   *
   */
  @Column()
  activated: boolean;

  @Column()
  validated: boolean;

  @Column()
  creatorUserId: string;

  @Column()
  teamId: string;

  // @Column({
  //   nullable: true,
  //   comment: 'conductor workflow json 定义',
  // })
  // workflowDef: Partial<MonkeyWorkflowDef>;

  // @Column({
  //   comment: 'workflow 变量',
  // })
  // variables?: BlockDefProperties[];

  // @Column({
  //   comment: 'workflow output 配置',
  // })
  // output: WorkflowOutputValue[];

  @Column({
    nullable: true,
    comment: 'fork from',
  })
  @Column()
  forkFromId?: string;

  @Column({
    nullable: true,
  })
  hidden?: boolean;

  @Column({
    nullable: true,
  })
  masterWorkflowId?: string;

  @Column({
    nullable: true,
  })
  masterWorkflowVersion?: number;

  // @Column({
  //   nullable: true,
  //   comment: '工作流校验错误/警告',
  // })
  // validationIssues?: WorkflowValidationIssue[];

  @Column()
  md5?: string;
}
