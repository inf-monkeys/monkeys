import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryAdminUserListDto {
  @ApiPropertyOptional({ description: '页码（从 1 开始）', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '搜索关键字（username/name/email）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateAdminUserDto {
  @ApiProperty({ description: '用户名（唯一）' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '姓名' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '邮箱（唯一）' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '明文密码（由前端生成随机密码）' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: '用户名（唯一）' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '邮箱（唯一）' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetAdminPasswordDto {
  @ApiProperty({ description: '明文新密码（由前端生成随机密码）' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AdminUserManagementItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  roles: string[];

  @ApiPropertyOptional()
  photo?: string;

  @ApiPropertyOptional()
  lastLoginAt?: number;

  @ApiProperty()
  loginsCount: number;

  @ApiProperty()
  createdTimestamp: number;

  @ApiProperty()
  updatedTimestamp: number;

  @ApiPropertyOptional()
  createdBy?: string;
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserManagementItemDto] })
  list: AdminUserManagementItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

