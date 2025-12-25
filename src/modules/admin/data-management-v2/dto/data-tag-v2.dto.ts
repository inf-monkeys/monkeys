import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryDataTagV2Dto {
  @ApiPropertyOptional({ description: '团队 ID' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional({ description: '关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '返回数量', default: 200 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '分页游标' })
  @IsString()
  @IsOptional()
  pageToken?: string;
}
