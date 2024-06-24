import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface CustomTheme {
  enableTeamLogo?: boolean;
  primaryColor?: string;
}

@Entity({ name: 'teams' })
export class TeamEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'icon_url',
    nullable: true,
  })
  iconUrl?: string;

  @Column({
    name: 'owner_user_id',
  })
  ownerUserId: string;

  @Column({
    name: 'is_builtin',
    default: false,
  })
  isBuiltIn?: boolean; // 只有默认团队会赠送猿力值

  @Column({
    name: 'is_public',
    default: false,
    type: 'boolean',
  })
  isPublic?: boolean;

  @Column({
    name: 'workflow_task_name_prefix',
    type: 'varchar',
    nullable: true,
  })
  workflowTaskNamePrefix?: string;

  @Column({
    name: 'custom_theme',
    nullable: true,
    type: 'simple-json',
  })
  customTheme?: CustomTheme;

  @Column({
    name: 'enable_join_request',
    nullable: true,
    default: false,
  })
  enableJoinRequest?: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'oneapi_token',
  })
  oneAPIToken?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'oneapi_password',
  })
  oneAPIPassword?: string;
}
