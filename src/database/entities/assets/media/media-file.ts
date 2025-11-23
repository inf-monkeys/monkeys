import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity, Index } from 'typeorm';
import { BaseAssetEntity } from '../base-asset';

export enum MediaSource {
  UPLOAD = 1,
  AIGC_INFER = 2,
  AUTO_GENERATE = 3,
  OUTPUT = 4,
}

export type MediaType = 'image' | 'text' | 'video' | 'audio' | string; // 支持完整的 mimetype（如 image/jpeg）

export type MediaImageParams = {
  width: number;
  height: number;
} & Record<string, unknown>;

@Entity({ name: 'media_files' })
@Index(['teamId']) // 为teamId添加索引，优化按团队查询媒体文件
@Index(['teamId', 'createdTimestamp']) // 优化分页查询时的排序
@Index(['teamId', 'type']) // 优化按媒体类型过滤
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
