import { BattleStrategy } from '@/database/entities/evaluation/battle-group.entity';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证其为必填的字符串。
 */
const IsRequiredString = Joiful.string().required();

/**
 * 验证其为必填的、至少包含2个元素的字符串数组。
 */
const IsAssetIdArray = Joiful.array()
  .required()
  .min(2)
  .items((s) => s.string());

/**
 * 验证其为必填的对战策略枚举。
 */
const IsBattleStrategy = Joiful.string().required().allow(['ROUND_ROBIN', 'RANDOM_PAIRS']);

/**
 * 验证其为最小值为1的数字。
 */
const IsPositiveNumber = Joiful.number().min(1);

// --- DTO 定义 ---

export class CreateBattleGroupDto {
  @ApiProperty({
    description: '排行榜ID',
    name: 'leaderboardId',
    type: String,
    required: true,
  })
  @IsRequiredString
  leaderboardId: string;

  @ApiProperty({
    description: '参与对战的图片资产ID列表（至少2张）',
    name: 'assetIds',
    type: [String],
    required: true,
  })
  @IsAssetIdArray
  assetIds: string[];

  @ApiProperty({
    description: '对战策略',
    name: 'strategy',
    enum: BattleStrategy,
    required: true,
    examples: {
      roundRobin: { value: 'ROUND_ROBIN', description: '循环赛：每两张图片都对战一次' },
      randomPairs: { value: 'RANDOM_PAIRS', description: '随机配对：指定对战次数' },
    },
  })
  @IsBattleStrategy
  strategy: BattleStrategy;

  @ApiProperty({
    description: '对战次数（仅随机配对策略需要）',
    name: 'battleCount',
    type: Number,
    required: false,
    minimum: 1,
  })
  @IsPositiveNumber
  battleCount?: number;

  @ApiProperty({
    description: '批量对战的描述说明',
    name: 'description',
    type: String,
    required: false,
  })
  @Joiful.string()
  description?: string;
}
