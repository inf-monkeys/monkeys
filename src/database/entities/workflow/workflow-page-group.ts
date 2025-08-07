import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'workflow_page_group' })
export class WorkflowPageGroupEntity extends BaseEntity {
  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'is_builtin',
    type: 'boolean',
  })
  isBuiltIn: boolean;

  @Column({
    name: 'icon_url',
    nullable: true,
  })
  iconUrl?: string;

  @Column({
    name: 'team_id',
    type: 'varchar',
  })
  teamId: string;

  @Column({
    name: 'page_ids',
    type: 'jsonb',
    nullable: false,
  })
  pageIds: string[];

  @Column({
    name: 'sort_index',
    type: 'integer',
    nullable: true,
  })
  sortIndex?: number;

  @Column({
    name: 'preset_relation_id',
    type: 'varchar',
    nullable: true,
  })
  presetRelationId?: string;
}
