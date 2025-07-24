import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../base/base';

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
}
