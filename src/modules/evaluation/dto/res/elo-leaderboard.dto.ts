import { ApiProperty } from '@nestjs/swagger';

export class EloLeaderboardItemDto {
  @ApiProperty({ description: '排名' })
  rank: number;

  @ApiProperty({ description: '资产ID' })
  assetId: string;

  @ApiProperty({ description: '资产信息' })
  asset: {
    id: string;
    name: string;
    type: string;
    url?: string;
    metadata?: any;
  };

  @ApiProperty({ description: 'ELO评分' })
  rating: number;

  @ApiProperty({ description: '评分偏差（可信度）' })
  rd: number;

  @ApiProperty({ description: '评分波动性' })
  vol: number;

  @ApiProperty({ description: '参与对战总数' })
  totalBattles: number;

  @ApiProperty({ description: '胜利次数' })
  wins: number;

  @ApiProperty({ description: '失败次数' })
  losses: number;

  @ApiProperty({ description: '平局次数' })
  draws: number;

  @ApiProperty({ description: '胜率' })
  winRate: number;

  @ApiProperty({ description: '最后更新时间' })
  lastUpdated: Date;

  @ApiProperty({ description: '评测员ID（如果按评测员筛选）' })
  evaluatorId?: string;

  @ApiProperty({ description: '评测员信息' })
  evaluator?: {
    id: string;
    name: string;
    type: string;
  };
}

export class EloLeaderboardDto {
  @ApiProperty({ description: '排行榜数据', type: [EloLeaderboardItemDto] })
  items: EloLeaderboardItemDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '评测模块信息' })
  module: {
    id: string;
    name: string;
    description?: string;
    totalParticipants: number;
    totalBattles: number;
  };

  @ApiProperty({ description: '统计信息' })
  stats: {
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    mostActiveBattler: {
      assetId: string;
      assetName: string;
      battleCount: number;
    };
    lastUpdated: Date;
  };
}