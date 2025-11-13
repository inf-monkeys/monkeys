import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDesignProjectVersionDto {
  @ApiProperty({
    description: '当前版本号',
    required: true,
  })
  @IsNumber()
  currentVersion: number;

  @ApiProperty({
    description: '新版本的显示名称',
    required: false,
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: '新版本的描述',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '新版本的图标URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  iconUrl?: string;
}

