import { AssetType } from '@/common/typings/asset';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'asset_tags' })
export class AssetsTagEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
  })
  type: AssetType;
}
