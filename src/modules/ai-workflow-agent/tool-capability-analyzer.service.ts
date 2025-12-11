import { Injectable, Logger } from '@nestjs/common';
import { ToolsRegistryService } from '../tools/tools.registry.service';

/**
 * 工具能力分析服务 - Phase 3
 *
 * 功能：
 * 1. 分析工具支持的参数
 * 2. 提取参数约束（类型、枚举值、必需性）
 * 3. 为 AI 提供工具能力清单
 */
@Injectable()
export class ToolCapabilityAnalyzerService {
  private readonly logger = new Logger(ToolCapabilityAnalyzerService.name);

  constructor(private readonly toolsRegistry: ToolsRegistryService) {}

  /**
   * 分析工具的参数支持情况
   */
  async analyzeToolCapabilities(
    toolNames: string[],
    teamId: string,
  ): Promise<ToolCapabilityMap> {
    const capabilities: ToolCapabilityMap = {};

    for (const toolName of toolNames) {
      try {
        const tool = await this.toolsRegistry.getToolByName(toolName);

        if (!tool) {
          this.logger.warn(`[Tool Capability] 工具 ${toolName} 不存在`);
          continue;
        }

        // 解析工具的 input 定义
        capabilities[toolName] = {
          name: toolName,
          displayName: this.extractDisplayName(tool.displayName, toolName),
          description: this.extractToolDescription(tool.description),
          supportedParams: this.extractSupportedParams(tool.input || []),
          requiredParams: this.extractRequiredParams(tool.input || []),
          paramConstraints: this.extractParamConstraints(tool.input || []),
          namespace: tool.namespace || 'unknown',
        };

        this.logger.debug(
          `[Tool Capability] ${toolName}: ${capabilities[toolName].supportedParams.length} 个参数`,
        );
      } catch (error) {
        this.logger.error(`[Tool Capability] 分析工具 ${toolName} 失败: ${error.message}`);
      }
    }

    return capabilities;
  }

  /**
   * 生成工具能力摘要（用于传给 LLM）
   */
  generateCapabilitySummary(capabilities: ToolCapabilityMap): string {
    let summary = '# 工具能力清单\n\n';

    for (const [toolName, capability] of Object.entries(capabilities)) {
      summary += `## ${capability.displayName} (${toolName})\n`;
      summary += `${capability.description}\n\n`;

      // 必需参数
      if (capability.requiredParams.length > 0) {
        summary += `**必需参数**: ${capability.requiredParams.join(', ')}\n`;
      }

      // 支持的参数
      summary += `**支持的参数**: ${capability.supportedParams.join(', ')}\n\n`;

      // 参数详情
      summary += '**参数详情**:\n';
      for (const [paramName, constraint] of Object.entries(capability.paramConstraints)) {
        summary += `- \`${paramName}\` (${constraint.type})`;
        if (constraint.required) {
          summary += ' [必需]';
        }
        if (constraint.enum && constraint.enum.length > 0) {
          summary += ` - 可选值: ${constraint.enum.join(', ')}`;
        }
        if (constraint.description) {
          summary += ` - ${constraint.description}`;
        }
        summary += '\n';
      }
      summary += '\n';
    }

    return summary;
  }

  /**
   * 检查参数是否被支持
   */
  checkParamSupport(
    toolName: string,
    paramName: string,
    capabilities: ToolCapabilityMap,
  ): boolean {
    return capabilities[toolName]?.supportedParams.includes(paramName) ?? false;
  }

  /**
   * 获取参数约束
   */
  getParamConstraints(
    toolName: string,
    paramName: string,
    capabilities: ToolCapabilityMap,
  ): ParamConstraint | undefined {
    return capabilities[toolName]?.paramConstraints[paramName];
  }

  // ==================== 私有方法 ====================

  private extractDisplayName(displayName: any, fallback: string): string {
    if (typeof displayName === 'string') {
      return displayName;
    }
    if (typeof displayName === 'object' && displayName !== null) {
      return (
        displayName['zh-CN'] ||
        displayName['en-US'] ||
        displayName['zh'] ||
        displayName['en'] ||
        fallback
      );
    }
    return fallback;
  }

  private extractToolDescription(description: any): string {
    if (typeof description === 'string') {
      return description;
    }
    if (typeof description === 'object' && description !== null) {
      return (
        description['zh-CN'] || description['en-US'] || description['zh'] || description['en'] || ''
      );
    }
    return '';
  }

  private extractSupportedParams(input: any[]): string[] {
    return input.map((param) => param.name).filter((name) => name);
  }

  private extractRequiredParams(input: any[]): string[] {
    return input
      .filter((param) => param.required)
      .map((param) => param.name)
      .filter((name) => name);
  }

  private extractParamConstraints(input: any[]): Record<string, ParamConstraint> {
    const constraints: Record<string, ParamConstraint> = {};

    for (const param of input) {
      if (!param.name) continue;

      constraints[param.name] = {
        type: param.type || 'string',
        enum: this.extractEnumValues(param),
        default: param.default,
        description: this.extractDescription(param),
        required: param.required || false,
      };
    }

    return constraints;
  }

  private extractEnumValues(param: any): any[] | undefined {
    if (param.options && Array.isArray(param.options)) {
      return param.options.map((opt: any) => opt.value || opt);
    }
    return undefined;
  }

  private extractDescription(param: any): string | undefined {
    if (typeof param.description === 'string') {
      return param.description;
    }
    if (typeof param.description === 'object' && param.description !== null) {
      // 处理多语言描述
      return param.description['zh-CN'] || param.description['en-US'] || param.description['zh'] || param.description['en'];
    }
    if (typeof param.displayName === 'string') {
      return param.displayName;
    }
    return undefined;
  }
}

// ==================== 类型定义 ====================

export interface ParamConstraint {
  type: string;
  enum?: any[];
  default?: any;
  description?: string;
  required: boolean;
}

export interface ToolCapability {
  name: string;
  displayName: string;
  description: string;
  supportedParams: string[];
  requiredParams: string[];
  paramConstraints: Record<string, ParamConstraint>;
  namespace: string;
}

export type ToolCapabilityMap = Record<string, ToolCapability>;
