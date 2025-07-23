import { ToolProperty } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'temporary_workflows' })
export class TemporaryWorkflowEntity extends BaseEntity {
  @Column({
    name: 'temporary_id',
    unique: true,
    comment: '临时工作流ID，用于外部系统调用',
  })
  temporaryId: string;

  @Column({
    name: 'workflow_id',
    comment: '原始工作流ID',
  })
  workflowId: string;

  @Column({
    name: 'workflow_version',
    comment: '工作流版本',
  })
  workflowVersion: number;

  @Column({
    name: 'team_id',
    comment: '团队ID',
  })
  teamId: string;

  @Column({
    name: 'user_id',
    comment: '创建用户ID',
  })
  userId: string;

  @Column({
    name: 'workflow_instance_id',
    nullable: true,
    comment: '工作流实例ID，执行后填充',
  })
  workflowInstanceId?: string;

  @Column({
    name: 'status',
    default: 'PENDING',
    comment: '状态：PENDING-待执行，RUNNING-执行中，COMPLETED-已完成，FAILED-失败',
  })
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

  @Column({
    name: 'expires_at',
    type: 'bigint',
    comment: '过期时间戳',
  })
  expiresAt: number;

  @Column({
    name: 'input_data',
    type: 'jsonb',
    nullable: true,
    comment: '输入数据',
  })
  inputData?: ToolProperty[];

  @Column({
    name: 'output_data',
    type: 'jsonb',
    nullable: true,
    comment: '输出数据',
  })
  outputData?: Record<string, any>;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: '错误信息',
  })
  errorMessage?: string;

  @Column({
    name: 'execution_time',
    type: 'bigint',
    nullable: true,
    comment: '执行时间戳',
  })
  executionTime?: number;

  @Column({
    name: 'completion_time',
    type: 'bigint',
    nullable: true,
    comment: '完成时间戳',
  })
  completionTime?: number;

  // 新增字段：保存完整的工作流执行结果
  @Column({
    name: 'raw_input',
    type: 'jsonb',
    nullable: true,
    comment: '原始输入数据',
  })
  rawInput?: Record<string, any>;

  @Column({
    name: 'formatted_output',
    type: 'jsonb',
    nullable: true,
    comment: '格式化输出数据（数组格式）',
  })
  formattedOutput?: any[];

  @Column({
    name: 'create_time',
    type: 'bigint',
    nullable: true,
    comment: '创建时间戳',
  })
  createTime?: number;

  @Column({
    name: 'start_time',
    type: 'bigint',
    nullable: true,
    comment: '开始时间戳',
  })
  startTime?: number;

  @Column({
    name: 'update_time',
    type: 'bigint',
    nullable: true,
    comment: '更新时间戳',
  })
  updateTime?: number;

  @Column({
    name: 'end_time',
    type: 'bigint',
    nullable: true,
    comment: '结束时间戳',
  })
  endTime?: number;

  @Column({
    name: 'instance_id',
    nullable: true,
    comment: '工作流实例ID',
  })
  instanceId?: string;

  @Column({
    name: 'extra_metadata',
    type: 'jsonb',
    nullable: true,
    comment: '额外元数据',
  })
  extraMetadata?: Record<string, any>;
}
