import { I18nValue } from '@inf-monkeys/monkeys';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { WorkflowMetadataEntity } from './workflow-metadata';

export type WorkflowAssociationType = 'to-workflow' | 'new-design';

@Entity({ name: 'workflow_associations' })
export class WorkflowAssociationsEntity extends BaseEntity {
  @Column({
    name: 'enabled',
    type: 'boolean',
  })
  enabled: boolean;

  @Column({
    name: 'display_name',
    type: 'jsonb',
  })
  displayName: I18nValue;

  @Column({
    name: 'description',
    type: 'jsonb',
    nullable: true,
  })
  description?: I18nValue | null;

  @Column({
    name: 'icon_url',
    type: 'text',
    nullable: true,
  })
  iconUrl?: string | null;

  @Column({
    name: 'sort_index',
    type: 'integer',
    nullable: true,
  })
  sortIndex?: number | null;

  @Column({
    name: 'origin_workflow_id',
  })
  originWorkflowId: string;

  @Column({
    name: 'type',
    type: 'varchar',
  })
  type: WorkflowAssociationType;

  @Column({
    name: 'target_workflow_id',
    nullable: true,
  })
  targetWorkflowId?: string;

  @Column({
    name: 'mapper',
    type: 'jsonb',
    nullable: true,
  })
  mapper?: Array<{
    origin: string;
    target: string;
    default?: string;
  }>;

  @ManyToOne(() => WorkflowMetadataEntity)
  @JoinColumn({ name: 'origin_workflow_id' })
  originWorkflow: WorkflowMetadataEntity;

  @ManyToOne(() => WorkflowMetadataEntity)
  @JoinColumn({ name: 'target_workflow_id' })
  targetWorkflow: WorkflowMetadataEntity;
}

export type UpdateAndCreateWorkflowAssociation = Pick<WorkflowAssociationsEntity, 'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex' | 'type'>;
