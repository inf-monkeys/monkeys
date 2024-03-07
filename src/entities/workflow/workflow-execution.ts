import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowTriggerType } from './workflow-trigger';

@Entity({ name: 'workflow-execution' })
export class WorkflowExecutionEntity extends BaseEntity {
  @Column()
  workflowId: string;

  @Column()
  workflowVersion: number;

  @Column()
  workflowInstanceId: string;

  /**
   * 执行的用户 ID
   */
  @Column()
  userId: string;

  @Column()
  triggerType: WorkflowTriggerType;

  @Column()
  chatSessionId?: string;
}
