import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetEloLeaderboardDto {
  @ApiProperty({ 
    description: '页码', 
    default: 1, 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量', 
    default: 20, 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: '评测员ID，用于筛选特定评测员的评分', 
    required: false 
  })
  @IsOptional()
  @IsString()
  evaluatorId?: string;

  @ApiProperty({ 
    description: '排序字段', 
    enum: ['rating', 'rd', 'vol', 'battles', 'winRate'], 
    default: 'rating',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'rd' | 'vol' | 'battles' | 'winRate' = 'rating';

  @ApiProperty({ 
    description: '排序方向', 
    enum: ['ASC', 'DESC'], 
    default: 'DESC',
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ 
    description: '最小对战次数筛选', 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  minBattles?: number;

  @ApiProperty({ 
    description: '搜索关键词（搜索资产名称）', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;
}