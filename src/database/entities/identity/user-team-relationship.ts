import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'user_team_relationships' })
export class UserTeamRelationshipEntity extends BaseEntity {
  @Column({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'team_id',
  })
  teamId: string;
}
