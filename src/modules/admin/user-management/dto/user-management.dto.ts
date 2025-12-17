import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryUserListDto {
  @ApiPropertyOptional({ description: '页码（从 1 开始）', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '搜索关键字（name/email/phone/nickname）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class CreateUserDto {
  @ApiProperty({ description: '姓名' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '邮箱（唯一）' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '明文密码（由前端生成随机密码）' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: '是否已验证' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: '是否拉黑' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '邮箱（唯一）' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '是否已验证' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: '是否拉黑' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class ResetUserPasswordDto {
  @ApiProperty({ description: '明文新密码（由前端生成随机密码）' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserManagementItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  nickname?: string;

  @ApiPropertyOptional()
  photo?: string;

  @ApiPropertyOptional()
  verified?: boolean;

  @ApiPropertyOptional()
  isBlocked?: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: number;

  @ApiPropertyOptional()
  loginsCount?: number;

  @ApiProperty()
  createdTimestamp: number;

  @ApiProperty()
  updatedTimestamp: number;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserManagementItemDto] })
  list: UserManagementItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

