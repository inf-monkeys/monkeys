import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, DataAssetType } from '@/database/entities/data-management/data-asset.entity';

/**
 * 创建资产 DTO
 */
export class CreateDataAssetDto {
  @ApiProperty({ description: '资产名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '所属视图 ID' })
  @IsString()
  @IsNotEmpty()
  viewId: string;

  @ApiProperty({ description: '资产类型', enum: ['image', 'video', '3d', 'text', 'document', 'audio', 'other'] })
  @IsEnum(['image', 'video', '3d', 'text', 'document', 'audio', 'other'])
  @IsNotEmpty()
  assetType: DataAssetType;

  @ApiProperty({ description: '主展示内容' })
  @IsObject()
  @IsNotEmpty()
  primaryContent: {
    type: 'text' | 'image' | 'video' | '3d';
    value: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
      size?: number;
      thumbnailUrl?: string;
    };
  };

  @ApiPropertyOptional({ description: '扩展属性' })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联文件列表' })
  @IsArray()
  @IsOptional()
  files?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;

  @ApiPropertyOptional({ description: '资产图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ description: '显示名称' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiPropertyOptional({ description: '资产描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '资产状态', enum: ['draft', 'published', 'archived'], default: 'draft' })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '排序序号', default: 0 })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '所属团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;
}

/**
 * 更新资产 DTO
 */
export class UpdateDataAssetDto {
  @ApiPropertyOptional({ description: '资产名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '显示名称' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: '资产描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '资产图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '主展示内容' })
  @IsObject()
  @IsOptional()
  primaryContent?: {
    type: 'text' | 'image' | 'video' | '3d';
    value: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
      size?: number;
      thumbnailUrl?: string;
    };
  };

  @ApiPropertyOptional({ description: '扩展属性' })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联文件列表' })
  @IsArray()
  @IsOptional()
  files?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;

  @ApiPropertyOptional({ description: '资产状态', enum: ['draft', 'published', 'archived'] })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '排序序号' })
  @IsNumber()
  @IsOptional()
  sort?: number;
}

/**
 * 移动资产 DTO
 */
export class MoveDataAssetDto {
  @ApiProperty({ description: '新的视图 ID' })
  @IsString()
  @IsNotEmpty()
  newViewId: string;
}

/**
 * 资产响应 DTO
 */
export class DataAssetResponseDto {
  @ApiProperty({ description: '资产 ID' })
  id: string;

  @ApiProperty({ description: '资产名称' })
  name: string;

  @ApiProperty({ description: '所属视图 ID' })
  viewId: string;

  @ApiProperty({ description: '资产类型' })
  assetType: DataAssetType;

  @ApiProperty({ description: '主展示内容' })
  primaryContent: any;

  @ApiPropertyOptional({ description: '扩展属性' })
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联文件列表' })
  files?: any[];

  @ApiProperty({ description: '浏览次数' })
  viewCount: number;

  @ApiProperty({ description: '下载次数' })
  downloadCount: number;

  @ApiProperty({ description: '资产状态' })
  status: AssetStatus;

  @ApiPropertyOptional({ description: '发布时间' })
  publishedAt?: number;

  @ApiPropertyOptional({ description: '所属团队 ID' })
  teamId?: string;

  @ApiProperty({ description: '创建者用户 ID' })
  creatorUserId: string;

  @ApiPropertyOptional({ description: '资产图标 URL' })
  iconUrl?: string;

  @ApiProperty({ description: '显示名称' })
  displayName: string;

  @ApiPropertyOptional({ description: '资产描述' })
  description?: string;

  @ApiProperty({ description: '是否预置' })
  isPreset: boolean;

  @ApiProperty({ description: '是否已发布' })
  isPublished: boolean;

  @ApiProperty({ description: '排序序号' })
  sort: number;

  @ApiProperty({ description: '创建时间' })
  createdTimestamp: number;

  @ApiProperty({ description: '更新时间' })
  updatedTimestamp: number;
}

/**
 * 资产列表查询 DTO
 */
export class QueryDataAssetDto {
  @ApiPropertyOptional({ description: '视图 ID' })
  @IsString()
  @IsOptional()
  viewId?: string;

  @ApiPropertyOptional({ description: '资产类型', enum: ['image', 'video', '3d', 'text', 'document', 'audio', 'other'] })
  @IsEnum(['image', 'video', '3d', 'text', 'document', 'audio', 'other'])
  @IsOptional()
  assetType?: DataAssetType;

  @ApiPropertyOptional({ description: '资产状态', enum: ['draft', 'published', 'archived'] })
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({ description: '创建者用户 ID' })
  @IsString()
  @IsOptional()
  creatorUserId?: string;

  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

/**
 * 资产列表响应 DTO
 */
export class DataAssetListResponseDto {
  @ApiProperty({ description: '资产列表', type: [DataAssetResponseDto] })
  list: DataAssetResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;
}
