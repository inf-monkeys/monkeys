import { CanvasApplication } from '@/common/typings/canvas';
import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../base-asset';

@Entity({ name: 'canvas_applications' })
export class CanvasApplicationEntity extends BaseAssetEntity {
  assetType: AssetType = 'canvas';

  @Column({
    name: 'app_name',
    type: 'varchar',
  })
  appName: CanvasApplication['appName'];

  @Column({
    name: 'creator_user_id',
    type: 'varchar',
  })
  creatorUserId: string;

  @Column({
    name: 'team_id',
    type: 'varchar',
  })
  teamId: string;
}
