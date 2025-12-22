import { Injectable, Logger } from '@nestjs/common';
import { ToolRepository } from '../repositories/tool.repository';
import { AgentService } from './agent.service';
import { ResolvedTool, ToolSourceType, ToolNotFoundError } from '../types/tool.types';

/**
 * Agent Tool Registry Service
 *
 * **职责**：
 * - 混合工具加载（外部 ToolEntity + 内置工具）
 * - 工具转换为 AI SDK 格式
 * - 工具权限过滤
 * - 工具缓存管理
 */
@Injectable()
export class AgentToolRegistryService {
  private readonly logger = new Logger(AgentToolRegistryService.name);

  // 内置工具注册表
  private readonly builtinTools: Map<string, ResolvedTool> = new Map();

  // 工具缓存（key: teamId:toolName）
  private readonly toolCache: Map<string, ResolvedTool> = new Map();

  constructor(
    private readonly toolRepository: ToolRepository,
    private readonly agentService: AgentService,
  ) {
    this.registerBuiltinTools();
  }

  /**
   * 获取 Agent 可用的工具（AI SDK 格式）
   */
  async getToolsForAgent(agentId: string, teamId: string): Promise<Record<string, any>> {
    const agent = await this.agentService.get(agentId, teamId);

    if (!agent.config.tools?.enabled) {
      return {}; // 工具未启用
    }

    const toolNames = agent.config.tools.toolNames || [];
    const tools: Record<string, any> = {};

    for (const toolName of toolNames) {
      try {
        const resolvedTool = await this.getToolByName(toolName, teamId);
        const aiTool = this.convertToAISDKTool(resolvedTool);
        tools[toolName] = aiTool;
      } catch (error) {
        this.logger.warn(`Failed to load tool ${toolName} for agent ${agentId}:`, error.message);
      }
    }

    this.logger.debug(`Loaded ${Object.keys(tools).length} tools for agent ${agentId}`);
    return tools;
  }

  /**
   * 获取单个工具定义（包含来源信息）
   */
  async getToolByName(toolName: string, teamId?: string): Promise<ResolvedTool> {
    // 检查缓存
    const cacheKey = this.getCacheKey(toolName, teamId);
    if (this.toolCache.has(cacheKey)) {
      return this.toolCache.get(cacheKey);
    }

    // 优先查找内置工具
    if (this.builtinTools.has(toolName)) {
      const tool = this.builtinTools.get(toolName);
      this.toolCache.set(cacheKey, tool);
      return tool;
    }

    // 查找外部工具（ToolEntity）
    const toolEntity = await this.toolRepository.findByName(toolName, teamId);
    if (!toolEntity) {
      throw new ToolNotFoundError(toolName);
    }

    const resolvedTool: ResolvedTool = {
      name: toolEntity.name,
      description: toolEntity.description as string,
      parameters: toolEntity.inputSchema,
      sourceType: ToolSourceType.EXTERNAL,
      metadata: {
        needsApproval: toolEntity.needsApproval,
        timeout: toolEntity.approvalPolicy?.timeout,
        category: toolEntity.category,
        version: toolEntity.version,
      },
    };

    // 缓存
    this.toolCache.set(cacheKey, resolvedTool);
    return resolvedTool;
  }

  /**
   * 注册内置工具
   */
  registerBuiltinTool(tool: ResolvedTool): void {
    this.builtinTools.set(tool.name, tool);
    this.logger.log(`Registered builtin tool: ${tool.name}`);
  }

  /**
   * 刷新工具缓存
   */
  async refreshCache(teamId?: string): Promise<void> {
    if (teamId) {
      // 清除特定团队的缓存
      const keysToDelete: string[] = [];
      for (const key of this.toolCache.keys()) {
        if (key.startsWith(`${teamId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.toolCache.delete(key));
      this.logger.log(`Refreshed tool cache for team ${teamId}`);
    } else {
      // 清除所有缓存
      this.toolCache.clear();
      this.logger.log('Refreshed all tool cache');
    }
  }

  /**
   * 将 ResolvedTool 转换为 AI SDK tool 格式
   */
  private convertToAISDKTool(resolvedTool: ResolvedTool): any {
    // Note: We don't provide execute function - tool execution is handled externally
    // by AgentToolExecutor which processes tool-call events from AI SDK
    return {
      description: resolvedTool.description,
      parameters: resolvedTool.parameters, // JSON Schema
    };
  }

  /**
   * 注册默认的内置工具
   */
  private registerBuiltinTools(): void {
    // 示例：搜索工具
    this.registerBuiltinTool({
      name: 'web_search',
      description: 'Search the web for information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
            default: 10,
          },
        },
        required: ['query'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 10000,
        category: 'search',
      },
    });

    this.logger.log(`Registered ${this.builtinTools.size} builtin tools`);
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(toolName: string, teamId?: string): string {
    return teamId ? `${teamId}:${toolName}` : `global:${toolName}`;
  }
}
