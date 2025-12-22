import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentEntity, AgentConfig } from '@/database/entities/agents/agent.entity';
import { ModelRegistryService } from './model-registry.service';

export interface CreateAgentDto {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string;
  iconUrl?: string;
  config: AgentConfig;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  iconUrl?: string;
  config?: Partial<AgentConfig>;
}

/**
 * Agent 服务
 *
 * **职责**：
 * - Agent CRUD 操作
 * - 配置验证
 * - 权限检查
 */
@Injectable()
export class AgentService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly modelRegistry: ModelRegistryService,
  ) {}

  /**
   * 创建 Agent
   */
  async create(dto: CreateAgentDto): Promise<AgentEntity> {
    // 验证配置
    this.validateConfig(dto.config);

    // 创建 Agent
    return await this.agentRepository.create(dto);
  }

  /**
   * 获取 Agent 详情
   */
  async get(id: string, teamId?: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findById(id);

    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    // 权限检查
    if (teamId && agent.teamId !== teamId) {
      throw new NotFoundException(`Agent ${id} not found in team ${teamId}`);
    }

    return agent;
  }

  /**
   * 列出团队的 Agents
   */
  async list(teamId: string): Promise<AgentEntity[]> {
    return await this.agentRepository.findByTeamId(teamId);
  }

  /**
   * 更新 Agent
   */
  async update(id: string, dto: UpdateAgentDto, teamId?: string): Promise<AgentEntity> {
    const agent = await this.get(id, teamId);

    // 合并配置
    const updatedConfig = dto.config ? { ...agent.config, ...dto.config } : agent.config;

    // 验证配置
    this.validateConfig(updatedConfig);

    // 更新
    return await this.agentRepository.update(id, {
      ...dto,
      config: updatedConfig,
    });
  }

  /**
   * 删除 Agent
   */
  async delete(id: string, teamId?: string): Promise<void> {
    await this.get(id, teamId); // 权限检查
    await this.agentRepository.delete(id);
  }

  /**
   * 获取可用模型列表
   */
  async listModels(teamId?: string) {
    return this.modelRegistry.listModels(teamId);
  }

  /**
   * 获取或创建默认 Agent（如 tldraw-assistant）
   * 如果 agent 不存在，则自动创建
   */
  async getOrCreateDefaultAgent(agentId: string, teamId: string, userId: string): Promise<AgentEntity> {
    // 获取默认 agent 配置
    const defaultAgentConfig = this.getDefaultAgentConfig(agentId);
    if (!defaultAgentConfig) {
      throw new NotFoundException(`Agent ${agentId} not found and is not a default agent`);
    }

    // 用 name 查找是否已存在（因为 name 在团队内唯一）
    const existingAgent = await this.agentRepository.findByNameAndTeam(
      defaultAgentConfig.name,
      teamId,
    );
    if (existingAgent) {
      return existingAgent;
    }

    console.log(`[AgentService] Auto-creating default agent: ${agentId} (${defaultAgentConfig.name}) for team ${teamId}`);

    // 创建默认 agent
    return await this.create({
      teamId,
      createdBy: userId,
      ...defaultAgentConfig,
    });
  }

  /**
   * 获取默认 Agent 的配置
   */
  private getDefaultAgentConfig(agentId: string): Omit<CreateAgentDto, 'teamId' | 'createdBy'> | null {
    const defaultAgents: Record<string, Omit<CreateAgentDto, 'teamId' | 'createdBy'>> = {
      'tldraw-assistant': {
        name: 'Tldraw Assistant',
        description: 'AI assistant for tldraw whiteboard collaboration with canvas-aware responses',
        iconUrl: '🎨',
        config: {
          model: 'openai:gpt-5.1',
          temperature: 0.7,
          maxTokens: 4000,
          instructions: `You are a helpful AI assistant integrated into a tldraw whiteboard.

You receive contextual information about the canvas including:
- Screenshots of the current whiteboard
- List of shapes currently on the canvas with their properties
- Information about user selections and viewport

Your role is to:
- Provide helpful suggestions and explanations about the canvas content
- Help users understand their diagrams, workflows, and designs
- Give advice on improving layouts and organization
- Answer questions about the content on the whiteboard
- Provide clear, visual explanations using descriptions

Note: Canvas operations (creating, editing, deleting shapes) are handled directly by the whiteboard interface.
Focus on being a helpful expert advisor for the user's work.

Be visual and creative in your explanations - describe diagrams clearly.
Be concise, friendly, and helpful.`,
          tools: {
            enabled: false,
            toolNames: [],
          },
        },
      },
    };

    return defaultAgents[agentId] || null;
  }

  /**
   * 验证 Agent 配置
   */
  private validateConfig(config: AgentConfig): void {
    // 验证模型 ID
    if (!config.model) {
      throw new BadRequestException('Model is required');
    }

    // 验证模型是否可用
    const availableModels = this.modelRegistry.listModels();
    const modelExists = availableModels.some((m) => m.id === config.model);

    if (!modelExists) {
      throw new BadRequestException(`Model ${config.model} is not available`);
    }

    // 验证 temperature
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        throw new BadRequestException('Temperature must be between 0 and 2');
      }
    }

    // 验证 maxTokens
    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 128000) {
        throw new BadRequestException('maxTokens must be between 1 and 128000');
      }
    }

    // 注意：不再验证 tools.toolNames，因为内置工具默认可用
    // 用户可以选择性地配置额外的外部工具
  }
}
