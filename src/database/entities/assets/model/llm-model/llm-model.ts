import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';

/** OneAPI Model Mapping, for example
 
{
  "66507989ff7d6e1d8b3f2517_moonshot-v1-8k": "moonshot-v1-8k",
  "66507989ff7d6e1d8b3f2517_moonshot-v1-32k": "moonshot-v1-32k",
  "66507989ff7d6e1d8b3f2517_moonshot-v1-128k": "moonshot-v1-128k"
}
 */

export interface LlmOneapiModel {
  [key: string]: string;
}

@Entity({ name: 'llm_models' })
export class LlmModelEntity extends BaseAssetEntity {
  assetType: AssetType = 'llm-model';

  @Column({ type: 'integer', nullable: true, comment: 'LLM Channel Type', name: 'oneapi_channel_type' })
  channelType: number;

  @Column({
    type: 'simple-json',
    nullable: true,
    name: 'oneapi_channel_id',
  })
  channelId: number;

  @Column({
    type: 'simple-json',
    nullable: true,
    name: 'oneapi_models',
  })
  models: LlmOneapiModel;
}

export type UpdateLlmModelParams = Partial<Pick<LlmModelEntity, 'displayName' | 'description' | 'iconUrl'>>;
