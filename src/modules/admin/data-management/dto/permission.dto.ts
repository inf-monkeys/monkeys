import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionType } from '@/database/entities/data-management/data-permission.entity';

/**
 * 添加权限 DTO
 */
export class AddPermissionDto {
  @ApiPropertyOptional({ description: '用户 ID（与 roleId 二选一）' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: '角色 ID（与 userId 二选一）' })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({ description: '权限类型', enum: ['read', 'write', 'delete', 'admin'] })
  @IsEnum(['read', 'write', 'delete', 'admin'])
  @IsNotEmpty()
  permission: PermissionType;
}

/**
 * 更新权限 DTO
 */
export class UpdatePermissionDto {
  @ApiProperty({ description: '权限类型', enum: ['read', 'write', 'delete', 'admin'] })
  @IsEnum(['read', 'write', 'delete', 'admin'])
  @IsNotEmpty()
  permission: PermissionType;
}

/**
 * 权限响应 DTO
 */
export class PermissionResponseDto {
  @ApiProperty({ description: '权限 ID' })
  id: string;

  @ApiPropertyOptional({ description: '用户 ID' })
  userId?: string;

  @ApiPropertyOptional({ description: '角色 ID' })
  roleId?: string;

  @ApiProperty({ description: '权限类型' })
  permission: PermissionType;

  @ApiProperty({ description: '创建时间' })
  createdTimestamp: number;

  @ApiProperty({ description: '更新时间' })
  updatedTimestamp: number;
}

/**
 * 视图权限响应 DTO
 */
export class DataViewPermissionResponseDto extends PermissionResponseDto {
  @ApiProperty({ description: '视图 ID' })
  viewId: string;
}

/**
 * 资产权限响应 DTO
 */
export class DataAssetPermissionResponseDto extends PermissionResponseDto {
  @ApiProperty({ description: '资产 ID' })
  assetId: string;
}

/**
 * 检查权限响应 DTO
 */
export class CheckPermissionResponseDto {
  @ApiProperty({ description: '是否有权限' })
  hasPermission: boolean;

  @ApiPropertyOptional({ description: '具体权限类型' })
  permission?: PermissionType;

  @ApiPropertyOptional({ description: '权限来源', enum: ['creator', 'direct', 'role', 'inherited', 'public'] })
  source?: 'creator' | 'direct' | 'role' | 'inherited' | 'public';
}
