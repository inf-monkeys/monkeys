import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface AssetFilterRule {
  createdTimestamp?: [number, number];
  updatedTimestamp?: [number, number];
  tagIds?: string[];
  userIds?: string[];
}

@Entity({ name: 'asset_filters' })
export class AssetFilterEntity extends BaseEntity {
  @Column({
    name: 'team_id',
    type: 'varchar',
  })
  teamId: string;

  @Column()
  name: string;

  @Column({
    name: 'creator_user_id',
    type: 'varchar',
    nullable: true,
  })
  creatorUserId: string;

  @Column({
    name: 'asset_type',
    type: 'varchar',
    nullable: true,
  })
  assetType?: AssetType;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  rules: AssetFilterRule;
}
