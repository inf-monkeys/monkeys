import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../base/base';
import { MarketplaceAppVersionEntity } from './marketplace-app-version.entity';

export enum MarketplaceAppStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'marketplace_apps' })
export class MarketplaceAppEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl?: string;

  @Index()
  @Column({ name: 'asset_type', type: 'varchar' })
  assetType: AssetType;

  @Index()
  @Column({ name: 'author_team_id', type: 'varchar' })
  authorTeamId: string;

  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: MarketplaceAppStatus,
    default: MarketplaceAppStatus.PENDING_APPROVAL,
  })
  status: MarketplaceAppStatus;

  @Column({ name: 'categories', type: 'simple-array', nullable: true })
  categories?: string[];

  @Column({ name: 'total_installs', type: 'int', default: 0 })
  totalInstalls: number;

  @OneToMany(() => MarketplaceAppVersionEntity, (version) => version.app)
  versions: MarketplaceAppVersionEntity[];
}
