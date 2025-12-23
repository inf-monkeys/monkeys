import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowFilterDto } from './workflow-filter.dto';

/**
 * 批量重命名请求
 */
export class BatchRenameDto {
  @ApiProperty({
    description: '搜索过滤条件',
    type: WorkflowFilterDto,
  })
  @ValidateNested()
  @Type(() => WorkflowFilterDto)
  filter: WorkflowFilterDto;

  @ApiProperty({
    description: '重命名模式（支持正则替换）',
    example: {
      search: 'upload image',
      replace: 'upload model',
      useRegex: false,
    },
  })
  @IsObject()
  renamePattern: {
    search: string;
    replace: string;
    useRegex?: boolean;
    caseSensitive?: boolean;
  };

  @ApiPropertyOptional({
    description: '是否预览模式（不实际修改）',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

/**
 * 批量重命名响应
 */
export class BatchRenameResultDto {
  @ApiProperty({
    description: '受影响的工作流列表',
  })
  affectedWorkflows: Array<{
    workflowId: string;
    recordId: string;
    oldDisplayName: { en: string; zh: string };
    newDisplayName: { en: string; zh: string };
    version: number;
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
}
