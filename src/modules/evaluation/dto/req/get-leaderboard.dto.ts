import { ListDto } from '@/common/dto/list.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetLeaderboardDto extends ListDto {
  @ApiProperty({
    description: '搜索关键词（按资产ID搜索）',
    required: false,
    example: 'asset-123',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
