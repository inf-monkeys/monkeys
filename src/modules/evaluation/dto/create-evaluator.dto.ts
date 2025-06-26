import { EvaluatorType } from '@/database/entities/evaluation/evaluator.entity';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

const IsRequiredString = Joiful.string().required();
const IsRequiredEvaluatorType = Joiful.string().required().allow(['llm', 'human']);

export class CreateEvaluatorDto {
  @ApiProperty({
    description: '评测员名称',
    name: 'name',
    type: String,
    required: true,
  })
  @IsRequiredString
  name: string;

  @ApiProperty({
    description: '评测员类型',
    name: 'type',
    enum: EvaluatorType,
    required: true,
  })
  @IsRequiredEvaluatorType
  type: EvaluatorType;

  @ApiProperty({
    description: 'LLM模型名称（仅LLM评测需要）',
    name: 'llmModelName',
    type: String,
    required: false,
  })
  @Joiful.string()
  llmModelName?: string;

  @ApiProperty({
    description: 'LLM评测重点（仅LLM评测需要）',
    name: 'evaluationFocus',
    type: String,
    required: false,
  })
  @Joiful.string()
  evaluationFocus?: string;

  @ApiProperty({
    description: '人工评测员用户ID（仅人工评测需要）',
    name: 'humanUserId',
    type: String,
    required: false,
  })
  @Joiful.string()
  humanUserId?: string;

  @ApiProperty({
    description: '评测员配置',
    name: 'config',
    type: Object,
    required: false,
  })
  @Joiful.object()
  config?: Record<string, any>;
}
