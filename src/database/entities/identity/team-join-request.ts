import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum TeamJoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'team_join_requests' })
export class TeamJoinRequestsEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'status',
    type: 'varchar',
  })
  status: TeamJoinRequestStatus;
}
