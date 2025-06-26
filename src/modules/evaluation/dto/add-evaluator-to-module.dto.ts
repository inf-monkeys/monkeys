import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证其为必填的字符串。
 */
const IsRequiredString = Joiful.string().required();

/**
 * 验证其为权重值：数字，最小为0，最大为10，默认为1.0。
 */
const IsWeight = Joiful.number().min(0).max(10).default(1.0);

// --- DTO 定义 ---

export class AddEvaluatorToModuleDto {
  @ApiProperty({
    description: '评测员ID',
    name: 'evaluatorId',
    type: String,
    required: true,
  })
  @IsRequiredString
  evaluatorId: string;

  @ApiProperty({
    description: '评测员权重',
    name: 'weight',
    type: Number,
    required: false,
    default: 1.0,
  })
  @IsWeight
  weight?: number;
}
