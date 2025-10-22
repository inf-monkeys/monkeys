import { I18nValue } from '@inf-monkeys/monkeys';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { IWorkflowAssociationExtraData, WorkflowAssociationType } from './workflow-association';
import { WorkflowMetadataEntity } from './workflow-metadata';

@Entity({ name: 'global_workflow_associations' })
export class GlobalWorkflowAssociationsEntity extends BaseEntity {
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
    name: 'team_id',
    nullable: true,
  })
  teamId: string;

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

  @Column({
    name: 'extra_data',
    type: 'jsonb',
    nullable: true,
  })
  extraData?: IWorkflowAssociationExtraData | null;

  @ManyToOne(() => WorkflowMetadataEntity)
  @JoinColumn({ name: 'target_workflow_id' })
  targetWorkflow: WorkflowMetadataEntity;

  @Column({
    name: 'prefer_app_id',
    nullable: true,
    type: 'varchar',
  })
  preferAppId?: string;
}

export type UpdateAndCreateGlobalWorkflowAssociations = Pick<
  GlobalWorkflowAssociationsEntity,
  'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex' | 'type' | 'extraData' | 'preferAppId'
>;

export type BaseWorkflowAssosciationEntity = Omit<GlobalWorkflowAssociationsEntity | Omit<GlobalWorkflowAssociationsEntity, 'targetWorkflow'>, 'teamId'>;

export type ExportedExtra = {
  scope: 'global' | 'specific';
};

export type BaseWorkflowAssosciation = BaseWorkflowAssosciationEntity & ExportedExtra;

export type ExportedGlobalWorkflowAssociationEntity = GlobalWorkflowAssociationsEntity & {
  scope: 'global';
};
