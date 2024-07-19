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
}
