import { AssetType, TargetType } from '@/common/typings/asset';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface AssetFilterRule {
  createdTimestamp?: [number, number];
  updatedTimestamp?: [number, number];
  tagIds?: string[];
  userIds?: string[];
}

@Entity({ name: 'asset_authorization' })
export class AssetAuthorizationEntity extends BaseEntity {
  @Column({
    name: 'asset_type',
    type: 'varchar',
  })
  assetType: AssetType;

  @Column({
    name: 'asset_id',
    type: 'varchar',
  })
  assetId: string;

  @Column({
    name: 'target_type',
    type: 'varchar',
  })
  targetType: TargetType;

  @Column({
    name: 'target_id',
    type: 'varchar',
  })
  targetId: string;
}
