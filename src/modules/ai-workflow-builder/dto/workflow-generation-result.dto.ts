import { ApiProperty } from '@nestjs/swagger';

/**
 * 单个工作流生成结果
 */
export class WorkflowGenerationResult {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '工作流ID',
    example: 'wf_abc123',
    required: false,
  })
  workflowId?: string;

  @ApiProperty({
    description: '工作流名称',
    example: '文生图_Gemini',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: '工作流显示名称',
    example: 'AI 文生图工作流',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    description: '错误信息',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: '验证问题（警告）',
    required: false,
  })
  warnings?: any[];
}

/**
 * 批量生成结果
 */
export class BatchGenerationResult {
  @ApiProperty({
    description: '总数',
    example: 20,
  })
  total: number;

  @ApiProperty({
    description: '成功数量',
    example: 18,
  })
  success: number;

  @ApiProperty({
    description: '失败数量',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: '详细结果',
    type: [WorkflowGenerationResult],
  })
  results: WorkflowGenerationResult[];

  @ApiProperty({
    description: '耗时（毫秒）',
    example: 30000,
  })
  duration: number;
}
