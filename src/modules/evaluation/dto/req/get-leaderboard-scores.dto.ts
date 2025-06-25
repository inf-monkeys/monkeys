import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证排序字段。
 */
const IsOrderBy = Joiful.string().allow(['rating', 'gamesPlayed']).default('rating');

/**
 * 验证排序方向。
 */
const IsOrderDirection = Joiful.string().allow(['ASC', 'DESC']).default('DESC');

// --- DTO 定义 ---

export class GetLeaderboardScoresDto extends PaginationDto {
  @ApiProperty({
    description: '评测员ID (可选，不指定则返回所有评测员的分数)',
    name: 'evaluatorId',
    type: String,
    required: false,
  })
  @Joiful.string()
  evaluatorId?: string;

  @ApiProperty({
    description: '排序字段 (rating: 按评分排序, gamesPlayed: 按对战次数排序)',
    name: 'orderBy',
    type: String,
    required: false,
  })
  @IsOrderBy
  orderBy?: 'rating' | 'gamesPlayed';

  @ApiProperty({
    description: '排序方向',
    name: 'orderDirection',
    type: String,
    required: false,
  })
  @IsOrderDirection
  orderDirection?: 'ASC' | 'DESC';
}
