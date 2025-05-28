import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'design_metadata' })
export class DesignMetadataEntity extends BaseEntity {
  @Column({
    name: 'display_name',
    type: 'varchar',
    nullable: true,
  })
  displayName: string;

  @Column({
    name: 'team_id',
    type: 'varchar',
    nullable: false,
  })
  teamId: string;

  @Column({
    name: 'design_project_id',
    type: 'varchar',
    nullable: false,
  })
  designProjectId: string;

  // sqlite doesn't support json type
  @Column({
    name: 'snapshot',
    type: 'jsonb',
    nullable: true,
  })
  snapshot: Record<string, any>;

  @Column({
    name: 'pinned',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  pinned: boolean;
}
