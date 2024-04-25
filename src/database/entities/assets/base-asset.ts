import { AssetType } from '@/common/typings/asset';
import { Column } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum AssetPublishPolicy {
  authorize = 'authorize',
  clone = 'clone',
  createNew = 'createNew',
}

export class AssetPublishConfig {
  policy: AssetPublishPolicy;
}

export class BaseAssetEntity extends BaseEntity {
  assetType: AssetType;
  public getAssetId(): string {
    return this.id;
  }

  @Column({
    name: 'team_id',
    nullable: true,
  })
  teamId: string;

  @Column({
    name: 'creator_user_id',
    nullable: true,
  })
  creatorUserId: string;

  @Column({
    nullable: true,
    name: 'icon_url',
  })
  iconUrl?: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'is_preset',
    default: false,
  })
  isPreset?: boolean;

  @Column({
    name: 'is_published',
    default: false,
    comment: '此资产是否被发布',
  })
  isPublished?: boolean;

  @Column({
    name: 'publish_config',
    type: 'simple-json',
    nullable: true,
  })
  publishConfig?: AssetPublishConfig;
}
