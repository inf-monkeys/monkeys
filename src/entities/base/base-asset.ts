import { AssetType } from '@/common/typings/asset';
import { Column } from 'typeorm';
import { BaseEntity } from './base';

export class BaseAssetEntity extends BaseEntity {
  @Column({
    name: 'asset_type',
  })
  assetType: AssetType;

  @Column({
    type: 'simple-json',
    name: 'tags',
    nullable: true,
  })
  tags?: string[];

  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'creator_user_id',
  })
  creatorUserId: string;

  @Column({
    nullable: true,
    name: 'icon_url',
  })
  iconUrl?: string;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description?: string;

  // 业务字段开始
  @Column({
    name: 'original_asset_id',
    nullable: true,
  })
  originAssetId?: string;

  @Column({
    name: 'is_preset_asset',
    default: false,
  })
  isPresetAsset?: boolean;

  @Column({
    name: 'is_public_asset',
    default: false,
  })
  isPublicAsset?: boolean;

  @Column({
    name: 'public_asset_category_ids',
    type: 'simple-json',
    nullable: true,
  })
  publicAssetCategoryIds?: string[];

  @Column({
    nullable: true,
    type: 'simple-json',
  })
  _importJson?: Record<string, any>;
}
