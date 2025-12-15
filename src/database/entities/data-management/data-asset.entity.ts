import { Column, Entity } from 'typeorm';
import { AdminBaseAssetEntity } from './admin-base-asset.entity';

export type DataAssetType = 'image' | 'video' | '3d' | 'text' | 'document' | 'audio' | 'other';

export enum AssetStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 数据资产实体
 * 存储实际的数据内容（图片、视频、3D模型、文本等）
 */
@Entity({ name: 'data_assets' })
export class DataAssetEntity extends AdminBaseAssetEntity {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: '资产名称',
  })
  name: string;

  // ========== 视图关联 ==========

  @Column({
    name: 'view_id',
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: '所属视图 ID',
  })
  viewId: string;

  // ========== 资产类型和内容 ==========

  @Column({
    name: 'asset_type',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '资产类型：image/video/3d/text/document/audio/other',
  })
  assetType: DataAssetType;

  @Column({
    name: 'primary_content',
    type: 'json',
    nullable: false,
    comment: '主展示内容',
  })
  primaryContent: {
    type: 'text' | 'image' | 'video' | '3d'; // 主展示类型
    value: string; // 文本内容 或 文件URL
    metadata?: {
      width?: number; // 图片/视频宽度
      height?: number; // 图片/视频高度
      duration?: number; // 视频/音频时长（秒）
      format?: string; // 文件格式
      size?: number; // 文件大小（字节）
      thumbnailUrl?: string; // 缩略图 URL
    };
  };

  @Column({
    name: 'keywords',
    type: 'text',
    nullable: true,
    comment: '关键词（字符串）',
  })
  keywords?: string;

  // ========== 扩展属性（完全自定义） ==========

  @Column({
    name: 'properties',
    type: 'json',
    nullable: true,
    comment: '扩展属性，JSON 格式，完全自定义',
  })
  properties?: Record<string, any>;

  // ========== 文件管理 ==========

  @Column({
    name: 'files',
    type: 'json',
    nullable: true,
    comment: '关联文件列表',
  })
  files?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;

  @Column({
    name: 'media',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '媒体文件 URL',
  })
  media?: string;

  @Column({
    name: 'thumbnail',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '缩略图 URL',
  })
  thumbnail?: string;

  // ========== 统计信息 ==========

  @Column({
    name: 'view_count',
    type: 'int',
    default: 0,
    comment: '浏览次数',
  })
  viewCount: number;

  @Column({
    name: 'download_count',
    type: 'int',
    default: 0,
    comment: '下载次数',
  })
  downloadCount: number;

  // ========== 状态 ==========

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'draft',
    comment: '状态：draft/published/archived',
  })
  status: AssetStatus;
}
