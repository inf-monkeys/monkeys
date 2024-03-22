import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'users' })
// TODO: 之前的数据手机号有重复的
@Index(['phone'])
@Index(['email'])
@Index(['externalId'])
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: true,
  })
  name: string;

  @Column({
    type: 'varchar',
  })
  photo: string;

  @Column({
    name: 'nickname',
    nullable: true,
  })
  nickname?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  email?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  password?: string;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'last_login_at',
  })
  lastLoginAt?: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'logins_count',
  })
  loginsCount?: number;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  verified?: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_blocked',
  })
  isBlocked?: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'external_id',
  })
  externalId?: string;
}
