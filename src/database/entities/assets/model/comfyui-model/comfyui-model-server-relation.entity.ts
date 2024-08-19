import { BaseEntity } from '@/database/entities/base/base';
import { ComfyuiServerEntity } from '@/database/entities/comfyui/comfyui-server.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ComfyuiModelEntity } from './comfyui-model.entity';

@Entity({ name: 'comfyui_model_server_relations' })
export class ComfyuiModelServerRelationEntity extends BaseEntity {
  @ManyToOne(() => ComfyuiModelEntity, (model) => model.serverRelations)
  model: ComfyuiModelEntity;

  @ManyToOne(() => ComfyuiServerEntity, (server) => server.models)
  server: ComfyuiServerEntity;

  @Column({
    name: 'team_id',
    type: 'varchar',
    length: 255,
  })
  teamId: string;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 255,
  })
  path: string;

  @Column({
    name: 'filename',
    type: 'varchar',
    length: 255,
  })
  filename: string;
}
