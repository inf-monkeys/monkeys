import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'comfyui_servers' })
export class ComfyuiServerEntity extends BaseEntity {
  @Column({
    name: 'team_id',
    nullable: true,
  })
  teamId?: string;

  @Column()
  name: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'base_url',
  })
  baseUrl: string;
}
