import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, ValidateNested, IsArray, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowFilterDto } from './workflow-filter.dto';

/**
 * 参数更新模式
 */
export enum ParameterUpdateMode {
  OVERRIDE = 'override', // 覆盖所有现有值
  DEFAULT = 'default', // 只在未设置时设置
  MERGE = 'merge', // 合并（用于对象类型）
}

/**
 * 单个参数更新操作
 */
export class ParameterUpdateOperation {
  @ApiProperty({
    description: '参数名称',
    example: 'aspect_ratio',
  })
  @IsString()
  parameterName: string;

  @ApiProperty({
    description: '新值（支持任意类型）',
    example: '16:9',
  })
  newValue: any;

  @ApiProperty({
    description: '更新模式',
    enum: ParameterUpdateMode,
    example: ParameterUpdateMode.OVERRIDE,
  })
  @IsEnum(ParameterUpdateMode)
  mode: ParameterUpdateMode;

  @ApiPropertyOptional({
    description: '目标任务引用名称（如果为空，则应用到所有匹配的任务）',
    example: 'generate_image_1',
  })
  @IsOptional()
  @IsString()
  targetTaskReferenceName?: string;
}

/**
 * 批量更新参数请求
 */
export class BatchUpdateParametersDto {
  @ApiProperty({
    description: '搜索过滤条件',
    type: WorkflowFilterDto,
  })
  @ValidateNested()
  @Type(() => WorkflowFilterDto)
  filter: WorkflowFilterDto;

  @ApiProperty({
    description: '参数更新操作列表',
    type: [ParameterUpdateOperation],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterUpdateOperation)
  parameterUpdates: ParameterUpdateOperation[];

  @ApiPropertyOptional({
    description: '是否预览模式（不实际修改）',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: '是否在修改后自动验证工作流',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoValidate?: boolean;
}

/**
 * 批量更新参数响应
 */
export class BatchUpdateParametersResultDto {
  @ApiProperty({
    description: '预览的修改内容',
  })
  previewChanges: Array<{
    workflowId: string;
    recordId: string;
    workflowName: string;
    version: number;
    changes: Array<{
      taskReferenceName: string;
      taskDisplayName: string;
      parameterName: string;
      before: any;
      after: any;
    }>;
    validationIssues?: Array<{
      taskReferenceName: string;
      issueType: string;
      message: string;
    }>;
  }>;

  @ApiProperty({
    description: '总计受影响的工作流数量',
  })
  totalAffected: number;

  @ApiProperty({
    description: '总计修改的参数次数',
  })
  totalParameterChanges: number;

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
