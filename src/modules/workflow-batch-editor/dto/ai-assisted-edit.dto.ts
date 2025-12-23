import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

/**
 * 操作类型
 */
export enum BatchEditOperationType {
  RENAME = 'rename',
  UPDATE_PARAMS = 'update_params',
  REPLACE_TOOL = 'replace_tool',
  UPDATE_DESCRIPTION = 'update_description',
  MIXED = 'mixed', // 混合多种操作
}

/**
 * AI 辅助批量编辑请求
 */
export class AiAssistedBatchEditDto {
  @ApiProperty({
    description: '自然语言编辑需求',
    example: '把所有使用 jimeng 生图的工作流，宽高比改成 16:9，分辨率改成 1920x1080',
  })
  @IsString()
  naturalLanguageRequest: string;

  @ApiPropertyOptional({
    description: '是否预览模式（不实际修改）',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: '是否返回详细的解析过程',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeParsingDetails?: boolean;
}

/**
 * AI 解析的编辑计划
 */
export interface ParsedEditPlan {
  operationType: BatchEditOperationType;
  confidence: number; // 0-1，AI 的置信度
  filter: {
    displayNamePattern?: string;
    toolName?: string;
    toolNamespace?: string;
    hasParameter?: string;
  };
  operations: Array<{
    type: 'rename' | 'update_param' | 'replace_tool' | 'update_description';
    target: string; // 目标字段/参数名
    oldValue?: any;
    newValue: any;
    mode?: string; // 对于参数更新
  }>;
  reasoning?: string; // AI 的推理过程（可选）
}

/**
 * AI 辅助批量编辑响应
 */
export class AiAssistedBatchEditResultDto {
  @ApiProperty({
    description: 'AI 解析出的操作计划',
  })
  parsedPlan: ParsedEditPlan;

  @ApiProperty({
    description: '预览的修改内容',
  })
  previewChanges: Array<{
    workflowId: string;
    recordId: string;
    workflowName: string;
    changes: Array<{
      field: string;
      before: any;
      after: any;
    }>;
  }>;

  @ApiProperty({
    description: '总计受影响的工作流数量',
  })
  totalAffected: number;

  @ApiProperty({
    description: '是否为预览模式',
  })
  isDryRun: boolean;

  @ApiPropertyOptional({
    description: '执行结果（仅在非预览模式）',
  })
  executionResult?: {
    successCount: number;
    failedCount: number;
    errors: Array<{ workflowId: string; error: string }>;
  };

  @ApiPropertyOptional({
    description: 'AI 解析的详细过程（仅在 includeParsingDetails=true 时返回）',
  })
  parsingDetails?: {
    rawLlmResponse: string;
    extractedIntent: string;
    toolsAnalyzed: string[];
  };
}
