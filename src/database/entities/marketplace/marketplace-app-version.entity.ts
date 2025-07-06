import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MarketplaceAssetSnapshot, SourceAssetReference } from '../../../modules/marketplace/types';
import { BaseEntity } from '../base/base';
import { MarketplaceAppEntity } from './marketplace-app.entity';

export enum MarketplaceAppVersionStatus {
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
}

@Entity({ name: 'marketplace_app_versions' })
export class MarketplaceAppVersionEntity extends BaseEntity {
  @Index()
  @Column({ name: 'app_id' })
  appId: string;

  @ManyToOne(() => MarketplaceAppEntity, (app) => app.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_id' })
  app: MarketplaceAppEntity;

  @Column({ name: 'version', type: 'varchar' })
  version: string;

  @Column({ name: 'release_notes', type: 'text', nullable: true })
  releaseNotes?: string;

  @Column({ name: 'asset_snapshot', type: 'jsonb' })
  assetSnapshot: MarketplaceAssetSnapshot;

  @Column({ name: 'source_asset_references', type: 'jsonb', nullable: true })
  sourceAssetReferences?: SourceAssetReference[];

  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: MarketplaceAppVersionStatus,
    default: MarketplaceAppVersionStatus.ACTIVE,
  })
  status: MarketplaceAppVersionStatus;
}
