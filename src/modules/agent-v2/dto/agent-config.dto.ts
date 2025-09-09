import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 更新智能体配置的DTO
 */
export class UpdateAgentConfigDto {
  @ApiProperty({ description: '模型名称', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: '温度参数 (0-2)', required: false, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ description: '最大token数', required: false, minimum: 1, maximum: 8192 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  maxTokens?: number;

  @ApiProperty({ description: '超时时间(毫秒)', required: false, minimum: 5000, maximum: 300000 })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(300000)
  timeout?: number;

  @ApiProperty({
    description: '推理努力配置',
    required: false,
    type: 'object',
    properties: {
      enabled: { type: 'boolean', description: '是否启用推理努力' },
      level: { type: 'string', enum: ['low', 'medium', 'high'], description: '推理努力级别' },
    },
  })
  @IsOptional()
  reasoningEffort?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}

/**
 * 智能体配置响应DTO
 */
export class AgentConfigResponseDto {
  @ApiProperty({ description: '操作是否成功' })
  success: boolean;

  @ApiProperty({ description: '更新后的智能体配置', required: false })
  data?: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    reasoningEffort: {
      enabled: boolean;
      level: string;
    };
  };

  @ApiProperty({ description: '错误信息', required: false })
  error?: string;
}
