import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'llm_channels' })
export class LlmChannelEntity extends BaseAssetEntity {
  assetType: AssetType = 'llm-channel';

  @Column({
    name: 'properites',
    type: 'simple-json',
  })
  properites: BlockDefProperties[];
}
