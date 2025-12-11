import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * 执行目标请求 DTO
 */
export class ExecuteGoalDto {
  @ApiProperty({
    description: '用户目标描述',
    example: '用 Gemini 3 Pro、Gemini 2.5 Image 和 Jimeng 生成图片，用户输入提示词、分辨率和宽高比',
  })
  @IsString()
  goal: string;

  @ApiProperty({
    description: '最大重试次数',
    example: 3,
    required: false,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number = 3;

  @ApiProperty({
    description: '额外的输入参数（会传递给工作流）',
    example: {
      prompt: '一只可爱的猫',
      resolution: 1024,
      aspect_ratio: '16:9',
    },
    required: false,
  })
  @IsOptional()
  inputParams?: Record<string, any>;
}

/**
 * 阶段信息
 */
export interface StageInfo {
  /** 阶段名称 */
  name: string;

  /** 阶段描述 */
  description: string;

  /** 成功标准 */
  successCriteria: string;

  /** 建议使用的工具 */
  tools?: string[];
}

/**
 * 阶段执行结果
 */
export interface StageResult {
  /** 是否成功 */
  success: boolean;

  /** 阶段名称 */
  stageName: string;

  /** 生成的工作流 ID */
  workflowId?: string;

  /** 工作流实例 ID */
  workflowInstanceId?: string;

  /** 输出结果 */
  output?: any;

  /** 错误信息 */
  error?: string;

  /** 尝试次数 */
  attempts: number;

  /** 执行时长（毫秒） */
  duration?: number;
}

/**
 * 执行目标响应 DTO
 */
export class ExecuteGoalResultDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '分解的阶段信息',
    type: 'array',
  })
  stages?: StageInfo[];

  @ApiProperty({
    description: '阶段执行结果',
    type: 'array',
  })
  stageResults?: StageResult[];

  @ApiProperty({
    description: '错误信息',
    example: null,
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: '总执行时长（毫秒）',
    example: 15000,
    required: false,
  })
  totalDuration?: number;
}
