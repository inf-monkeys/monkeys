import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

const AssetTypes = ['image', 'video', '3d', 'text', 'document', 'audio', 'other'] as const;
type AssetType = (typeof AssetTypes)[number];

export class QueryDataAssetV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '视图 ID' })
  @IsString()
  @IsOptional()
  viewId?: string;

  @ApiPropertyOptional({ description: '搜索关键词（仅 name + displayName）' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Tag ID 列表（逗号分隔）' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsNumber()
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '下一页游标' })
  @IsString()
  @IsOptional()
  pageToken?: string;
}

export class CreateDataAssetV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ description: '资产名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '资产类型', enum: AssetTypes })
  @IsEnum(AssetTypes)
  assetType: AssetType;

  @ApiProperty({ description: '主展示内容' })
  @IsObject()
  primaryContent: Record<string, any>;

  @ApiPropertyOptional({ description: '扩展属性' })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联文件列表' })
  @IsArray()
  @IsOptional()
  files?: any[];

  @ApiPropertyOptional({ description: '媒体文件 URL' })
  @IsOptional()
  media?: string;

  @ApiPropertyOptional({ description: '缩略图 URL' })
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({ description: '资产状态', enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '显示名称' })
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tag ID 列表' })
  @IsArray()
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ description: '扩展字段' })
  @IsObject()
  @IsOptional()
  extra?: Record<string, any>;

  @ApiPropertyOptional({ description: '自定义 ID' })
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ description: '自定义创建时间戳' })
  @IsOptional()
  createdTimestamp?: number;

  @ApiPropertyOptional({ description: '自定义更新时间戳' })
  @IsOptional()
  updatedTimestamp?: number;
}

export class UpdateDataAssetV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '资产名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '资产类型', enum: AssetTypes })
  @IsEnum(AssetTypes)
  @IsOptional()
  assetType?: AssetType;

  @ApiPropertyOptional({ description: '主展示内容' })
  @IsObject()
  @IsOptional()
  primaryContent?: Record<string, any>;

  @ApiPropertyOptional({ description: '扩展属性' })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: '关联文件列表' })
  @IsArray()
  @IsOptional()
  files?: any[];

  @ApiPropertyOptional({ description: '媒体文件 URL' })
  @IsOptional()
  media?: string;

  @ApiPropertyOptional({ description: '缩略图 URL' })
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  keywords?: string;

  @ApiPropertyOptional({ description: '资产状态', enum: ['draft', 'published', 'archived'] })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '显示名称' })
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tag ID 列表' })
  @IsArray()
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ description: '扩展字段' })
  @IsObject()
  @IsOptional()
  extra?: Record<string, any>;
}

export class BatchDeleteDataAssetV2Dto {
  @ApiProperty({ description: '团队 ID' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ description: '资产 ID 列表' })
  @IsArray()
  @IsNotEmpty()
  ids: string[];
}
