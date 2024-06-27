import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AssetType, ToolProperty } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'llm_channels' })
export class LlmChannelEntity extends BaseAssetEntity {
  assetType: AssetType = 'llm-channel';

  @Column({
    name: 'properites',
    type: 'simple-json',
  })
  properites: ToolProperty[];
}
