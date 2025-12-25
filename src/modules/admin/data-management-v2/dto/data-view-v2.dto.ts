import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDataViewV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ description: '视图名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '父视图 ID' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: '展示配置' })
  @IsObject()
  @IsOptional()
  displayConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: '排序' })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: 'Tag ID 列表（默认过滤）' })
  @IsArray()
  @IsOptional()
  tagIds?: string[];
}

export class UpdateDataViewV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '视图名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '展示配置' })
  @IsObject()
  @IsOptional()
  displayConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: '排序' })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: 'Tag ID 列表（默认过滤）' })
  @IsArray()
  @IsOptional()
  tagIds?: string[];
}

export class BatchUpdateViewSortV2Dto {
  @ApiProperty({ description: '团队 ID' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ description: '排序列表' })
  @IsArray()
  items: Array<{ id: string; sort: number }>;
}

export class UpdateViewTagsV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ description: 'Tag ID 列表' })
  @IsArray()
  @IsOptional()
  tagIds?: string[];
}
