import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum ComfyuiServerStatus {
  Unkonwn = 'UNKOWN',
  UP = 'UP',
  DOWN = 'DOWN',
}

@Entity({ name: 'comfyui_servers' })
export class ComfyuiServerEntity extends BaseEntity {
  @Column({
    name: 'team_id',
    type: 'varchar',
    length: 1024,
    nullable: true,
  })
  teamId?: string;

  @Column({
    name: 'creator_user_id',
    type: 'varchar',
    length: 1024,
    nullable: true,
  })
  creatorUserId?: string;

  @Column({
    name: 'address',
    type: 'varchar',
    length: 1024,
  })
  address: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 64,
    default: ComfyuiServerStatus.Unkonwn,
  })
  status: ComfyuiServerStatus;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 1024,
  })
  description: string;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  isDefault: boolean;
}
