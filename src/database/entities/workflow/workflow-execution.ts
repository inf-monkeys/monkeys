import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowTriggerType } from './workflow-trigger';

@Entity({ name: 'workflow_execution' })
export class WorkflowExecutionEntity extends BaseEntity {
  @Column({
    name: 'workflow_id',
  })
  workflowId: string;

  @Column({
    name: 'workflow_version',
  })
  workflowVersion: number;

  @Column({
    name: 'workflow_instance_id',
  })
  workflowInstanceId: string;

  @Column({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'trigger_type',
    type: 'varchar',
  })
  triggerType: WorkflowTriggerType;

  @Column({
    name: 'chat_session_id',
    nullable: true,
  })
  chatSessionId?: string;

  @Column({
    name: 'group',
    nullable: true,
  })
  group?: string;

  @Column({
    name: 'status',
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  status: WorkflowStatusEnum;

  @Column({
    name: 'takes',
    nullable: true,
  })
  takes: number;

  @Column({
    name: 'apikey',
    nullable: true,
  })
  apikey: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'input',
  })
  input?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'output',
  })
  output?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'tasks',
  })
  tasks?: Record<string, any>[];

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'conductor_create_time',
  })
  conductorCreateTime?: number;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'conductor_start_time',
  })
  conductorStartTime?: number;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'conductor_end_time',
  })
  conductorEndTime?: number;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'conductor_update_time',
  })
  conductorUpdateTime?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'executed_workflow_definition',
  })
  executedWorkflowDefinition?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'execution_variables',
  })
  executionVariables?: Record<string, any>;
}
