import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../../base-asset';

export type CreateComfyuiModelTypeParams = Pick<ComfyuiModelTypeEntity, 'displayName' | 'description' | 'name' | 'path'>;

export type UpdateComfyuiModelTypeParams = Partial<Pick<ComfyuiModelTypeEntity, 'displayName' | 'description' | 'name' | 'path'>>;

export type GetComfyuiModelTypeQuery = Partial<Pick<ComfyuiModelTypeEntity, 'name' | 'path'>>;

@Entity({ name: 'comfyui_model_type' })
export class ComfyuiModelTypeEntity extends BaseAssetEntity {
  assetType: AssetType = 'comfyui-model-type';

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 255,
  })
  path: string;
}
