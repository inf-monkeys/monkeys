import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

export type VectorCollectionField = {
  name: string;
  displayName: string;
  description: string;
  builtIn: boolean;
  required: boolean;
};

@Entity({ name: 'knowledge_bases' })
export class KnowLedgeBaseEntity extends BaseAssetEntity {
  assetType: AssetType = 'knowledge-base';

  @Column({})
  name: string;

  @Column({
    name: 'embedding_model',
  })
  embeddingModel: string;

  @Column()
  dimension: number;
}
