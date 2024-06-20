import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../base-asset';

export enum MediaSource {
  UPLOAD = 1,
  AIGC_INFER = 2,
  AUTO_GENERATE = 3,
}

export type MediaType = 'image' | 'text' | 'video' | 'audio';

export type MediaImageParams = {
  width: number;
  height: number;
} & Record<string, unknown>;

@Entity({ name: 'media_files' })
export class MediaFileEntity extends BaseAssetEntity {
  assetType: AssetType = 'media-file';

  @Column({
    type: 'varchar',
  })
  type: MediaType;

  @Column()
  url: string;

  @Column({
    type: 'varchar',
  })
  source: MediaSource;

  @Column({
    nullable: true,
  })
  size?: number;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  params?: any;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  md5?: string;
}
