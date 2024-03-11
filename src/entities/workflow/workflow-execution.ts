import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowTriggerType } from './workflow-trigger';

@Entity({ name: 'workflow-execution' })
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
  })
  triggerType: WorkflowTriggerType;

  @Column({
    name: 'chat_session_id',
  })
  chatSessionId?: string;
}
