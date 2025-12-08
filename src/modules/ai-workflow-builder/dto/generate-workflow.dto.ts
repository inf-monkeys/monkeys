import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * 单个工作流描述
 */
export class WorkflowDescriptor {
  @ApiProperty({
    description: '工作流名称',
    example: '文生图_Gemini',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '工作流描述（自然语言）',
    example: '用Gemini 3 Pro生成图片，用户输入提示词、选择分辨率和宽高比',
  })
  @IsString()
  description: string;
}

/**
 * 批量生成请求（模式A：相同工作流复制）
 */
export class BatchGenerateSameDto {
  @ApiProperty({
    description: '工作流描述（自然语言）',
    example: '创建文生图工作流，用Gemini 3 Pro，用户输入提示词和分辨率',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: '生成数量',
    example: 20,
  })
  @IsNumber()
  count: number;

  @ApiProperty({
    description: '命名模式（使用 {index} 作为序号占位符）',
    example: 'text_to_image_{index}',
    required: false,
  })
  @IsOptional()
  @IsString()
  namingPattern?: string;

  @ApiProperty({
    description: '是否自动激活工作流',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoActivate?: boolean;
}

/**
 * 批量生成请求（模式B：不同工作流）
 */
export class BatchGenerateDifferentDto {
  @ApiProperty({
    description: '工作流描述列表',
    type: [WorkflowDescriptor],
    example: [
      {
        name: '文生图_Gemini',
        description: '用Gemini 3 Pro生成图片，用户输入提示词、选择分辨率和宽高比',
      },
      {
        name: '图生图_GPT',
        description: '用GPT-image-1进行图生图，用户上传图片和修改提示词',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowDescriptor)
  workflows: WorkflowDescriptor[];

  @ApiProperty({
    description: '是否自动激活工作流',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoActivate?: boolean;
}

/**
 * 单个工作流生成请求
 */
export class GenerateWorkflowDto {
  @ApiProperty({
    description: '工作流描述（自然语言）',
    example: '创建一个文生图工作流，使用Gemini 3 Pro，用户可以输入提示词和选择分辨率',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: '工作流名称（可选，AI会自动生成）',
    required: false,
    example: 'AI文生图工作流',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '是否自动激活工作流',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoActivate?: boolean;
}
