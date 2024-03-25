import { CanvasApplication } from '@/common/typings/canvas';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../base-asset';

@Entity({ name: 'canvas' })
export class CanvasEntity extends BaseAssetEntity {
  @Column({
    name: 'app_name',
  })
  appName: CanvasApplication['appName'];

  @Column()
  creatorUserId: string;

  @Column()
  teamId: string;
}
