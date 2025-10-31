import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowExecutionEntity } from '../workflow/workflow-execution';

@Entity({ name: 'tools_execution' })
export class ToolsExecutionEntity extends BaseEntity {
  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'namespace',
  })
  namespace: string;

  @Column({
    name: 'reference_name',
  })
  referenceName: string;

  @Column({
    name: 'workflow_execution_id',
  })
  workflowExecutionId: string;

  @ManyToOne(() => WorkflowExecutionEntity, (workflow) => workflow.toolsExecutions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_execution_id', referencedColumnName: 'id' })
  workflowExecution: WorkflowExecutionEntity;

  @Column({
    name: 'takes',
    nullable: true,
  })
  takes: number;

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
}
