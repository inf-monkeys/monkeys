import { AssetType, I18nValue } from '@inf-monkeys/monkeys';
import { AfterLoad, Column } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum AssetPublishPolicy {
  authorize = 'authorize',
  clone = 'clone',
  createNew = 'createNew',
}

export class AssetPublishConfig {
  policy: AssetPublishPolicy;
}

export class BaseAssetEntity extends BaseEntity {
  assetType: AssetType;
  public getAssetId(): string {
    return this.id;
  }

  @Column({
    name: 'team_id',
    nullable: true,
  })
  teamId: string;

  @Column({
    name: 'creator_user_id',
    nullable: true,
  })
  creatorUserId: string;

  @Column({
    nullable: true,
    name: 'icon_url',
  })
  iconUrl?: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
  })
  displayName: string | I18nValue;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  description?: string | I18nValue;

  @Column({
    name: 'is_preset',
    default: false,
  })
  isPreset?: boolean;

  @Column({
    name: 'is_published',
    default: false,
    comment: '此资产是否被发布',
  })
  isPublished?: boolean;

  @Column({
    name: 'publish_config',
    type: 'simple-json',
    nullable: true,
  })
  publishConfig?: AssetPublishConfig;

  @AfterLoad()
  afterLoad?() {
    try {
      this.displayName = JSON.parse(this.displayName as string);
    } catch (error) {}

    try {
      this.description = JSON.parse(this.description as string);
    } catch (error) {}
  }

  getDisplayNameStr(defaultLocale = 'en-US') {
    if (typeof this.displayName === 'string') {
      return this.displayName;
    } else if (typeof this.displayName === 'object' && this.displayName !== null) {
      return this.displayName[defaultLocale] || this.displayName['en-US'] || this.displayName[Object.keys(this.displayName)[0]];
    } else {
      return '';
    }
  }
}
