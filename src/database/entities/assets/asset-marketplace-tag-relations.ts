import { AssetType } from '@/common/typings/asset';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'asset_marketplace_tag_relations' })
export class AssetsMarketplaceTagRelationsEntity extends BaseEntity {
  @Column({
    name: 'tag_id',
    type: 'varchar',
  })
  tagId: string;

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
}
