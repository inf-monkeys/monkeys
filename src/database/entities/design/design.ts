import { BaseEntity } from '@/database/entities/base/base';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'design' })
export class DesignEntity extends BaseEntity {
  @Column({
    name: 'team_id',
    type: 'varchar',
    nullable: false,
  })
  teamId: string;

  @Column({
    name: 'design_snapshot',
    type: 'json',
  })
  designSnapshot: Record<string, any>;

  @Column({
    name: 'design_name',
    type: 'varchar',
    nullable: true,
  })
  name: string;
}
