import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

/**
 * 工作流搜索过滤条件
 */
export class WorkflowFilterDto {
  @ApiPropertyOptional({
    description: '显示名称模糊匹配（支持中英文）',
    example: 'upload image',
  })
  @IsOptional()
  @IsString()
  displayNamePattern?: string;

  @ApiPropertyOptional({
    description: '工具名称（精确匹配）',
    example: 'gemini_3_pro_image_generate',
  })
  @IsOptional()
  @IsString()
  toolName?: string;

  @ApiPropertyOptional({
    description: '工具命名空间',
    example: 'third_party_api',
  })
  @IsOptional()
  @IsString()
  toolNamespace?: string;

  @ApiPropertyOptional({
    description: '工作流ID列表（直接指定）',
    example: ['workflow_123', 'workflow_456'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workflowIds?: string[];

  @ApiPropertyOptional({
    description: '参数名称（查找包含此参数的工作流）',
    example: 'aspect_ratio',
  })
  @IsOptional()
  @IsString()
  hasParameter?: string;

  @ApiPropertyOptional({
    description: '工作流分类',
    example: 'gen-image',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
