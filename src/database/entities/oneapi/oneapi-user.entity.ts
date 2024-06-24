import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface CustomTheme {
  enableTeamLogo?: boolean;
  primaryColor?: string;
}

@Entity({ name: 'oneapi_users' })
export class OneApiUsersEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    nullable: true,
    name: 'team_id',
  })
  teamId: string;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'user_id',
  })
  userId: number;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'user_token',
  })
  userToken?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'api_key',
  })
  apiKey?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'username',
  })
  username?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'password',
  })
  password?: string;
}
