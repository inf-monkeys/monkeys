import { Column, Entity, Index } from 'typeorm';
import { InstalledAssetInfo } from '../../../modules/marketplace/types';
import { BaseEntity } from '../base/base';

@Entity({ name: 'installed_apps' })
export class InstalledAppEntity extends BaseEntity {
  @Index()
  @Column({ name: 'team_id' })
  teamId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'installed_asset_ids', type: 'jsonb' })
  installedAssetIds: InstalledAssetInfo;

  @Index()
  @Column({ name: 'marketplace_app_version_id' })
  marketplaceAppVersionId: string;

  @Index()
  @Column({ name: 'is_update_available', default: false })
  isUpdateAvailable: boolean;
}
