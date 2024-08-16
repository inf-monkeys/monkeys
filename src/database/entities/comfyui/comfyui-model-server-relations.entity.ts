import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'comfyui_model_server_relations' })
export class ComfyuiModelServerRelationsEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'server_id',
    type: 'varchar',
  })
  serverId: string;

  @Column({
    name: 'model_id',
    type: 'varchar',
  })
  modelId: string;
}
