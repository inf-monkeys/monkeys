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

    // 验证 tools
    if (config.tools?.enabled && (!config.tools.toolNames || config.tools.toolNames.length === 0)) {
      throw new BadRequestException('toolNames is required when tools are enabled');
    }
  }
}
