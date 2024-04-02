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

@Entity({ name: 'text_collections' })
export class TextCollectionEntity extends BaseAssetEntity {
  assetType: AssetType = 'text-collection';

  @Column({
    name: 'display_name',
  })
  displayName: string;

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
  })
  indexType: string;

  @Column({
    name: 'index_param',
    type: 'simple-json',
  })
  indexParam: any;

  @Column()
  dimension: number;

  @Column({
    name: 'metadata_fields',
    type: 'simple-json',
  })
  metadataFields: VectorCollectionField[];

  entityCount?: number;
  fileCount?: number;
}
