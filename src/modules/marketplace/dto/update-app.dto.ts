import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateMarketplaceAppDto {
  @ApiProperty({ description: '更新后的应用名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '更新后的应用描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '更新后的应用图标 URL', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({
    description: '更新后的应用分类',
    required: false,
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];
}
