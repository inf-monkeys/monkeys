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
    name: 'description',
  })
  description: string;

  @Column({
    name: 'embedding_model',
  })
  embeddingModel: string;

  @Column({
    name: 'index_type',
    nullable: true,
  })
  indexType: string;

  @Column({
    name: 'index_param',
    type: 'simple-json',
    nullable: true,
  })
  indexParam: any;

  @Column()
  dimension: number;

  @Column({
    name: 'metadata_fields',
    type: 'simple-json',
    nullable: true,
  })
  metadataFields: VectorCollectionField[];
}
