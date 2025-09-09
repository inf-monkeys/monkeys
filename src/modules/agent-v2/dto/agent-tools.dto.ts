import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

/**
 * 更新智能体工具配置的DTO
 */
export class UpdateAgentToolsDto {
  @ApiProperty({ description: '是否启用外部工具' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: '允许使用的外部工具名称列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  toolNames: string[];
}

/**
 * 工具信息响应DTO
 */
export class ToolInfoDto {
  @ApiProperty({ description: '工具名称' })
  name: string;

  @ApiProperty({ description: '工具显示名称' })
  displayName: string;

  @ApiProperty({ description: '工具描述' })
  description: string;

  @ApiProperty({ description: '工具命名空间（外部工具）', required: false })
  namespace?: string;

  @ApiProperty({ description: '工具分类', required: false })
  categories?: string[];

  @ApiProperty({ description: '工具图标', required: false })
  icon?: string;

  @ApiProperty({ description: '是否为内置工具', required: false })
  builtin?: boolean;
}

/**
 * 智能体工具配置响应DTO
 */
export class AgentToolsConfigDto {
  @ApiProperty({ description: '内置工具列表', type: [ToolInfoDto] })
  builtin: ToolInfoDto[];

  @ApiProperty({ description: '外部工具配置' })
  external: {
    enabled: string[];
    available: ToolInfoDto[];
  };
}

/**
 * 更新智能体工具配置的响应DTO
 */
export class UpdateAgentToolsResponseDto {
  @ApiProperty({ description: '操作是否成功' })
  success: boolean;

  @ApiProperty({ description: '更新后的工具配置', required: false })
  data?: AgentToolsConfigDto;

  @ApiProperty({ description: '错误信息', required: false })
  error?: string;
}

/**
 * 获取可用工具的响应DTO
 */
export class AvailableToolsResponseDto {
  @ApiProperty({ description: '操作是否成功' })
  success: boolean;

  @ApiProperty({ description: '可用工具信息' })
  data: {
    builtin: ToolInfoDto[];
    external: ToolInfoDto[];
  };
}
