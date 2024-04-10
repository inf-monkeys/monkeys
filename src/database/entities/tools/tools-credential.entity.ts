import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

/**
 * 密钥数据表
 */
@Entity({ name: 'tools_credentials' })
export class ToolsCredentialEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'creator_user_id',
  })
  creatorUserId: string;

  @Column()
  type: string;
}
