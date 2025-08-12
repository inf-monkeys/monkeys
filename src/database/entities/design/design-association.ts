import { I18nValue } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'design_associations' })
export class DesignAssociationEntity extends BaseEntity {
  @Column({
    name: 'team_id',
    type: 'varchar',
    length: 128,
  })
  teamId: string;

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
    name: 'target_workflow_id',
    nullable: true,
  })
  targetWorkflowId?: string;

  @Column({
    name: 'target_input_id',
    type: 'text',
  })
  targetInputId: string;

  @Column({
    name: 'prefer_app_id',
    nullable: true,
    type: 'varchar',
  })
  preferAppId?: string;
}
