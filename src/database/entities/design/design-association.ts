import { I18nValue } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export type DesignAssociationType = 'team' | 'tenant';

@Entity({ name: 'design_associations' })
export class DesignAssociationsEntity extends BaseEntity {
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
    name: 'type',
    type: 'varchar',
  })
  type: DesignAssociationType;

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
}
