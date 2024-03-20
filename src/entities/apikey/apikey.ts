import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum ApiKeyStatus {
  Valid = 'valid',
  Revoked = 'revoked',
}

@Entity({ name: 'apikey' })
export class ApiKeyEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'creator_user_id',
  })
  creatorUserId: string;

  @Column({
    name: 'api_key',
  })
  apiKey: string;

  @Column({
    type: 'varchar',
  })
  status: ApiKeyStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  desc?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  applicationId?: string;

  // 私有的 ApiKey 是由后端逻辑创建的，不会被返回给前端
  @Column({
    type: 'boolean',
    default: false,
  })
  isPrivate?: boolean;
}
