import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证其为必填的字符串。
 */
const IsRequiredString = Joiful.string().required();

// --- DTO 定义 ---

export class CreateBattleDto {
  @ApiProperty({
    description: '排行榜ID',
    name: 'leaderboardId',
    type: String,
    required: true,
  })
  @IsRequiredString
  leaderboardId: string;

  @ApiProperty({
    description: '参与对战的图片A的资产ID',
    name: 'assetAId',
    type: String,
    required: true,
  })
  @IsRequiredString
  assetAId: string;

  @ApiProperty({
    description: '参与对战的图片B的资产ID',
    name: 'assetBId',
    type: String,
    required: true,
  })
  @IsRequiredString
  assetBId: string;

  @ApiProperty({
    description: '评测员ID (可选，用于指定特定评测员)',
    name: 'evaluatorId',
    type: String,
    required: false,
  })
  @Joiful.string()
  evaluatorId?: string;
}
