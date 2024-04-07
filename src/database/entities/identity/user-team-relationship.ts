import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'team_members' })
export class TeamMembersEntity extends BaseEntity {
  @Column({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'team_id',
  })
  teamId: string;
}
