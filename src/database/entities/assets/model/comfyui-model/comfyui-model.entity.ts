import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseAssetEntity } from '../../base-asset';
import { ComfyuiModelServerRelationEntity } from './comfyui-model-server-relation.entity';

export type CreateComfyuiModelParams = Pick<ComfyuiModelEntity, 'sha256'> & Partial<Pick<ComfyuiModelEntity, 'id' | 'displayName' | 'description' | 'serverRelations'>>;

@Entity({ name: 'comfyui_model' })
export class ComfyuiModelEntity extends BaseAssetEntity {
  assetType: AssetType = 'comfyui-model';

  @Column({
    name: 'sha256',
    type: 'varchar',
    length: 255,
  })
  sha256: string;

  @OneToMany(() => ComfyuiModelServerRelationEntity, (servers) => servers.model)
  serverRelations?: ComfyuiModelServerRelationEntity[];
}
