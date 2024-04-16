import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'knowledge_bases_sql' })
export class SqlKnowLedgeBaseEntity extends BaseAssetEntity {
  assetType: AssetType = 'knowledge-base-sql';

  @Column({})
  uuid: string;
}
