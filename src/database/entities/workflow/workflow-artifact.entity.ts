import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowExecutionEntity } from './workflow-execution';

@Entity({ name: 'workflow_artifacts' })
export class WorkflowArtifactEntity extends BaseEntity {
  @PrimaryColumn()
  url: string;

  @Column()
  type: 'image' | 'video' | 'file';

  @Column({
    name: 'instance_id',
  })
  instanceId: string;

  @ManyToOne(() => WorkflowExecutionEntity, (execution) => execution.artifacts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'instance_id', referencedColumnName: 'workflowInstanceId' })
  execution?: WorkflowExecutionEntity;
}
