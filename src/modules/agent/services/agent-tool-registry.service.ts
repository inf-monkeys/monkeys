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
   *
   * **默认行为**：
   * - 所有内置工具默认可用（无需配置）
   * - 如果 agent.config.tools.toolNames 配置了额外工具，则加载这些外部工具
   * - 系统工具（如 list_tools）始终可用
   */
  async getToolsForAgent(agentId: string, teamId: string): Promise<Record<string, any>> {
    let agent;
    try {
      agent = await this.agentService.get(agentId, teamId);
    } catch (error) {
      this.logger.warn(`Agent ${agentId} not found, returning empty tools`);
      return {}; // Agent 不存在，返回空工具列表
    }

    const tools: Record<string, any> = {};

    // 1. 加载所有内置工具（默认）
    for (const [toolName, resolvedTool] of this.builtinTools.entries()) {
      try {
        const aiTool = this.convertToAISDKTool(resolvedTool);
        tools[toolName] = aiTool;
      } catch (error) {
        this.logger.warn(`Failed to load builtin tool ${toolName}:`, error.message);
      }
    }

    // 2. 加载用户配置的额外工具（外部工具）
    const configuredToolNames = agent.config.tools?.toolNames || [];
    for (const toolName of configuredToolNames) {
      // 跳过已加载的内置工具
      if (this.builtinTools.has(toolName)) {
        continue;
      }

      try {
        const resolvedTool = await this.getToolByName(toolName, teamId);
        const aiTool = this.convertToAISDKTool(resolvedTool);
        tools[toolName] = aiTool;
      } catch (error) {
        this.logger.warn(`Failed to load external tool ${toolName} for agent ${agentId}:`, error.message);
      }
    }

    this.logger.debug(`Loaded ${Object.keys(tools).length} tools for agent ${agentId} (${this.builtinTools.size} builtin, ${configuredToolNames.length} configured)`);
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

    // Tldraw 工具：获取画布状态
    this.registerBuiltinTool({
      name: 'tldraw_get_canvas_state',
      description: 'Get the current state of the tldraw canvas including all shapes and user selections',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // Tldraw 工具：创建形状
    this.registerBuiltinTool({
      name: 'tldraw_create_shape',
      description: 'Create a new shape on the tldraw canvas. Supports rectangles, ellipses, arrows, text, and more.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['geo', 'arrow', 'text', 'note', 'line'],
            description: 'The type of shape to create',
          },
          x: {
            type: 'number',
            description: 'X coordinate position',
            default: 0,
          },
          y: {
            type: 'number',
            description: 'Y coordinate position',
            default: 0,
          },
          props: {
            type: 'object',
            description: 'Shape-specific properties. For geo: {geo: "rectangle"|"ellipse"|"triangle"|"diamond", w: number, h: number}. For text: {text: string, w: number}. For arrow: {start: {x, y}, end: {x, y}}',
          },
        },
        required: ['type', 'props'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // Tldraw 工具：更新形状
    this.registerBuiltinTool({
      name: 'tldraw_update_shape',
      description: 'Update an existing shape on the tldraw canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'The ID of the shape to update',
          },
          updates: {
            type: 'object',
            description: 'Properties to update (x, y, rotation, props, etc.)',
          },
        },
        required: ['shapeId', 'updates'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // Tldraw 工具：删除形状
    this.registerBuiltinTool({
      name: 'tldraw_delete_shapes',
      description: 'Delete one or more shapes from the tldraw canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape IDs to delete. If empty, deletes currently selected shapes.',
          },
        },
        required: [],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // Tldraw 工具：选择形状
    this.registerBuiltinTool({
      name: 'tldraw_select_shapes',
      description: 'Select one or more shapes on the tldraw canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of shape IDs to select',
          },
        },
        required: ['shapeIds'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // 工作流工具：列出可用工作流
    this.registerBuiltinTool({
      name: 'list_workflows',
      description: 'List all available workflows in the current team. Returns workflow ID, name, description, input parameters, and output configuration for each workflow.',
      parameters: {
        type: 'object',
        properties: {
          includeHidden: {
            type: 'boolean',
            description: 'Whether to include hidden workflows',
            default: false,
          },
        },
        required: [],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 10000,
        category: 'workflow',
      },
    });

    // 工作流工具：执行工作流
    this.registerBuiltinTool({
      name: 'execute_workflow',
      description: 'Execute a workflow with specified input data. Use list_workflows first to see available workflows and their required inputs. Returns the workflow execution result including all outputs.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow to execute (from list_workflows)',
          },
          inputData: {
            type: 'object',
            description: 'Input data for the workflow. The structure depends on the workflow\'s input configuration (variables). Use list_workflows to see required inputs.',
          },
          sync: {
            type: 'boolean',
            description: 'Whether to wait for workflow completion and return results (true) or return immediately with execution ID (false)',
            default: true,
          },
        },
        required: ['workflowId', 'inputData'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: true, // 执行工作流需要审批
        timeout: 300000, // 5分钟超时
        category: 'workflow',
      },
    });

    // 工具管理：列出可用工具
    this.registerBuiltinTool({
      name: 'list_tools',
      description: 'List all tools available to this agent. Returns tool name, description, parameters schema, category, and whether approval is needed for each tool.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter tools by category (e.g., "tldraw", "workflow", "search")',
          },
          includeParameters: {
            type: 'boolean',
            description: 'Whether to include detailed parameter schemas in the response',
            default: true,
          },
        },
        required: [],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'system',
      },
    });

    // Tldraw 工具：在画板上创建工作流节点
    this.registerBuiltinTool({
      name: 'tldraw_create_workflow',
      description: 'Create a workflow node on the tldraw canvas. This allows you to generate and place workflows on the canvas based on user needs. First use list_workflows to find available workflows.',
      parameters: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'The ID of the workflow to create (from list_workflows)',
          },
          x: {
            type: 'number',
            description: 'X coordinate position on canvas',
            default: 100,
          },
          y: {
            type: 'number',
            description: 'Y coordinate position on canvas',
            default: 100,
          },
          width: {
            type: 'number',
            description: 'Width of the workflow node',
            default: 300,
          },
          height: {
            type: 'number',
            description: 'Height of the workflow node',
            default: 200,
          },
        },
        required: ['workflowId'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
      },
    });

    // Tldraw 工具：加载完整的画板状态
    this.registerBuiltinTool({
      name: 'tldraw_load_canvas_state',
      description: 'Load a complete canvas state into tldraw. This replaces the entire canvas with the provided state including all shapes, connections, and configurations.',
      parameters: {
        type: 'object',
        properties: {
          canvasState: {
            type: 'object',
            description: 'The complete tldraw canvas state object including session and document data',
          },
        },
        required: ['canvasState'],
      },
      sourceType: ToolSourceType.BUILTIN,
      metadata: {
        needsApproval: false,
        timeout: 5000,
        category: 'tldraw',
        clientSide: true, // 前端执行
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

  /**
   * 获取所有内置工具列表
   */
  getBuiltinTools(): ResolvedTool[] {
    return Array.from(this.builtinTools.values());
  }

  /**
   * 获取团队的外部工具列表
   */
  async getExternalTools(teamId: string): Promise<any[]> {
    return await this.toolRepository.findAvailableForTeam(teamId);
  }

  /**
   * 获取团队可用的所有工具（内置 + 外部）
   * 用于 Agent 编辑页面显示工具列表
   */
  async getAvailableTools(teamId: string): Promise<any[]> {
    const tools: any[] = [];

    // 1. 添加所有内置工具
    for (const builtinTool of this.builtinTools.values()) {
      tools.push({
        name: builtinTool.name,
        description: builtinTool.description,
        inputSchema: builtinTool.parameters,
        category: builtinTool.metadata?.category || 'builtin',
        needsApproval: builtinTool.metadata?.needsApproval || false,
        approvalPolicy: builtinTool.metadata?.timeout
          ? { timeout: builtinTool.metadata.timeout }
          : undefined,
        isPublic: true, // 内置工具默认公开
        version: builtinTool.metadata?.version,
        sourceType: builtinTool.sourceType,
      });
    }

    // 2. 添加外部工具（来自 agent_tools 表）
    const externalTools = await this.toolRepository.findAvailableForTeam(teamId);
    for (const tool of externalTools) {
      tools.push({
        id: tool.id,
        teamId: tool.teamId,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        category: tool.category || 'custom',
        needsApproval: tool.needsApproval,
        approvalPolicy: tool.approvalPolicy,
        isPublic: tool.isPublic,
        version: tool.version,
        iconUrl: tool.iconUrl,
        sourceType: ToolSourceType.EXTERNAL,
        createdTimestamp: tool.createdTimestamp,
        updatedTimestamp: tool.updatedTimestamp,
      });
    }

    return tools;
  }
}
