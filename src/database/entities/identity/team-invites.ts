import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum TeamInviteLinkOutdateType {
  SEVEN_DAYS = 1,
  NEVER = 2,
}

export enum TeamInviteType {
  INDIVIDUAL = 1,
  PUBLIC = 2,
}

export enum TeamInviteStatus {
  EFFECTIVE = 1,
  ACCEPTED = 2,
  DISABLED = 3,
}

@Entity({ name: 'team_invites' })
export class TeamInvitesRequestsEntity extends BaseEntity {
  @Column({
    name: 'inviter_user_id',
  })
  inviterUserId: string;

  @Column({
    name: 'target_user_id',
    nullable: true,
  })
  targetUserId?: string;

  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'type',
    type: 'int',
  })
  type: TeamInviteType; // 若为 PUBLIC 则无人数限制

  @Column({
    name: 'outdate_timestamp',
  })
  outdateTimestamp: number;

  @Column({
    name: 'status',
    type: 'int',
  })
  status: TeamInviteStatus;

  @Column({
    name: 'accepted_user_ids',
    type: 'simple-json',
  })
  acceptedUserIds: string[];

  @Column({
    name: 'remark',
    type: 'text',
    nullable: true,
  })
  remark?: string;
}
