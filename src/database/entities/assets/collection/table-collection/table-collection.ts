import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'table_collections' })
export class TableCollectionEntity extends BaseAssetEntity {
  assetType: AssetType = 'table-collection';

  @Column({
    type: 'varchar',
    default: 'sqlite3',
  })
  type: 'sqlite3';
}
