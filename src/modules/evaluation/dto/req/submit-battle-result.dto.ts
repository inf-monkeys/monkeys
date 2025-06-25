import { BattleResult } from '@/database/entities/evaluation/evaluation-battle.entity';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证其为必填的对战结果。
 */
const IsBattleResult = Joiful.string().required().allow(['A_WIN', 'B_WIN', 'DRAW']);

/**
 * 验证其为必填的字符串。
 */
const IsRequiredString = Joiful.string().required();

// --- DTO 定义 ---

export class SubmitBattleResultDto {
  @ApiProperty({
    description: '对战结果 (A_WIN: A获胜, B_WIN: B获胜, DRAW: 平局)',
    name: 'result',
    enum: BattleResult,
    required: true,
  })
  @IsBattleResult
  result: BattleResult;

  @ApiProperty({
    description: '评测员ID',
    name: 'evaluatorId',
    type: String,
    required: true,
  })
  @IsRequiredString
  evaluatorId: string;

  @ApiProperty({
    description: '评判理由 (可选，仅用于人工评测)',
    name: 'reason',
    type: String,
    required: false,
  })
  @Joiful.string()
  reason?: string;
}
