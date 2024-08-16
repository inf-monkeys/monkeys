import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../../base-asset';

@Entity({ name: 'comfyui_model' })
export class ComfyuiModelEntity extends BaseAssetEntity {
  assetType: AssetType = 'comfyui-model';

  @Column({
    name: 'filename',
    type: 'varchar',
    length: 255,
  })
  filename: string;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 255,
  })
  path: string;

  @Column({
    name: 'sha256',
    type: 'varchar',
    length: 255,
  })
  sha256: string;
}
