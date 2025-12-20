import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminPermissionItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  resource: string;

  @ApiProperty()
  action: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdTimestamp: number;

  @ApiProperty()
  updatedTimestamp: number;
}

export class AdminRoleItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ type: [AdminPermissionItemDto] })
  permissions: AdminPermissionItemDto[];

  @ApiProperty()
  createdTimestamp: number;

  @ApiProperty()
  updatedTimestamp: number;
}

export class CreateAdminRoleDto {
  @ApiProperty({ description: '角色 code（唯一）' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '角色名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAdminRoleDto {
  @ApiPropertyOptional({ description: '角色 code（唯一）' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SetRolePermissionsDto {
  @ApiProperty({ description: '权限 ID 列表（整量覆盖）', type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

