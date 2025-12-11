import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建视图 DTO
 */
export class CreateDataViewDto {
  @ApiProperty({ description: '视图名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '视图描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '视图图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '父视图 ID，不提供则为根视图' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: '筛选配置' })
  @IsObject()
  @IsOptional()
  filterConfig?: {
    conditions: Array<{
      field: string;
      operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'between' | 'gt' | 'gte' | 'lt' | 'lte';
      value: any;
    }>;
    logic: 'AND' | 'OR';
  };

  @ApiPropertyOptional({ description: '显示配置' })
  @IsObject()
  @IsOptional()
  displayConfig?: {
    columns?: string[];
    defaultSort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    pageSize?: number;
  };

  @ApiPropertyOptional({ description: '是否公开', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

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
 * 更新视图 DTO
 */
export class UpdateDataViewDto {
  @ApiPropertyOptional({ description: '视图名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '视图描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '视图图标 URL' })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiPropertyOptional({ description: '筛选配置' })
  @IsObject()
  @IsOptional()
  filterConfig?: {
    conditions: Array<{
      field: string;
      operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'between' | 'gt' | 'gte' | 'lt' | 'lte';
      value: any;
    }>;
    logic: 'AND' | 'OR';
  };

  @ApiPropertyOptional({ description: '显示配置' })
  @IsObject()
  @IsOptional()
  displayConfig?: {
    columns?: string[];
    defaultSort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    pageSize?: number;
  };

  @ApiPropertyOptional({ description: '是否公开' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '排序序号' })
  @IsNumber()
  @IsOptional()
  sort?: number;
}

/**
 * 移动视图 DTO
 */
export class MoveDataViewDto {
  @ApiProperty({ description: '新的父视图 ID，null 表示移动到根级' })
  @IsString()
  @IsOptional()
  newParentId?: string | null;
}

/**
 * 视图响应 DTO
 */
export class DataViewResponseDto {
  @ApiProperty({ description: '视图 ID' })
  id: string;

  @ApiProperty({ description: '视图名称' })
  name: string;

  @ApiPropertyOptional({ description: '视图描述' })
  description?: string;

  @ApiPropertyOptional({ description: '视图图标 URL' })
  iconUrl?: string;

  @ApiPropertyOptional({ description: '父视图 ID' })
  parentId?: string;

  @ApiProperty({ description: '视图路径' })
  path: string;

  @ApiProperty({ description: '视图层级' })
  level: number;

  @ApiProperty({ description: '排序序号' })
  sort: number;

  @ApiPropertyOptional({ description: '筛选配置' })
  filterConfig?: any;

  @ApiPropertyOptional({ description: '显示配置' })
  displayConfig?: any;

  @ApiProperty({ description: '创建者用户 ID' })
  creatorUserId: string;

  @ApiPropertyOptional({ description: '所属团队 ID' })
  teamId?: string;

  @ApiProperty({ description: '是否公开' })
  isPublic: boolean;

  @ApiProperty({ description: '资产数量' })
  assetCount: number;

  @ApiProperty({ description: '创建时间' })
  createdTimestamp: number;

  @ApiProperty({ description: '更新时间' })
  updatedTimestamp: number;

  @ApiPropertyOptional({ description: '子视图列表（树形结构时）' })
  children?: DataViewResponseDto[];
}

/**
 * 视图树响应 DTO
 */
export class DataViewTreeResponseDto {
  @ApiProperty({ description: '树形结构的视图列表', type: [DataViewResponseDto] })
  tree: DataViewResponseDto[];
}

/**
 * 视图列表查询 DTO
 */
export class QueryDataViewDto {
  @ApiPropertyOptional({ description: '父视图 ID，不提供则查询所有' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
