import { Injectable, NotFoundException } from '@nestjs/common';
import { ThreadRepository } from '../repositories/thread.repository';
import { MessageRepository } from '../repositories/message.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentService } from './agent.service';
import { ThreadEntity, ThreadMetadata, ThreadState } from '@/database/entities/agents/thread.entity';

export interface CreateThreadDto {
  teamId: string;
  userId: string;
  agentId?: string;
  title?: string;
  metadata?: ThreadMetadata;
}

export interface UpdateThreadDto {
  title?: string;
  metadata?: Partial<ThreadMetadata>;
  state?: Partial<ThreadState>;
}

/**
 * Thread 服务
 *
 * **职责**：
 * - Thread CRUD 操作
 * - Thread 状态管理
 * - 权限检查
 */
@Injectable()
export class ThreadService {
  constructor(
    private readonly threadRepository: ThreadRepository,
    private readonly messageRepository: MessageRepository,
    private readonly agentRepository: AgentRepository,
    private readonly agentService: AgentService,
  ) {}

  /**
   * 创建 Thread
   */
  async create(dto: CreateThreadDto): Promise<ThreadEntity> {
    // 如果指定了 agentId，验证或自动创建
    let validatedAgentId = dto.agentId;
    if (dto.agentId) {
      try {
        // 尝试获取或创建默认 agent，并使用返回的真实数据库 ID
        const agent = await this.agentService.getOrCreateDefaultAgent(dto.agentId, dto.teamId, dto.userId);
        validatedAgentId = agent.id; // 使用数据库中的真实 ID，而不是传入的名称标识符
      } catch (error) {
        // 如果不是默认 agent 且不存在，设为 null
        console.warn(`Agent ${dto.agentId} not found and not a default agent, creating thread without agent`);
        validatedAgentId = null;
      }
    }

    return await this.threadRepository.create({
      ...dto,
      agentId: validatedAgentId,
      lastMessageAt: new Date(),
    });
  }

  /**
   * 获取 Thread 详情
   */
  async get(id: string, teamId?: string): Promise<ThreadEntity> {
    const thread = await this.threadRepository.findById(id);

    if (!thread) {
      throw new NotFoundException(`Thread ${id} not found`);
    }

    // 权限检查
    if (teamId && thread.teamId !== teamId) {
      throw new NotFoundException(`Thread ${id} not found in team ${teamId}`);
    }

    return thread;
  }

  /**
   * 列出用户的 Threads
   */
  async listByUser(userId: string, teamId: string, agentId?: string): Promise<ThreadEntity[]> {
    const threads = await this.threadRepository.findByUserId(userId, teamId);

    // 如果指定了 agentId，只返回该 agent 的 threads
    if (agentId) {
      return threads.filter((t) => t.agentId === agentId);
    }

    return threads;
  }

  /**
   * 列出 Agent 的 Threads
   */
  async listByAgent(agentId: string, teamId?: string): Promise<ThreadEntity[]> {
    const threads = await this.threadRepository.findByAgentId(agentId);

    // 权限检查
    if (teamId) {
      return threads.filter((t) => t.teamId === teamId);
    }

    return threads;
  }

  /**
   * 更新 Thread
   */
  async update(id: string, dto: UpdateThreadDto, teamId?: string): Promise<ThreadEntity> {
    const thread = await this.get(id, teamId);

    // 合并 metadata 和 state
    const updatedMetadata = dto.metadata ? { ...thread.metadata, ...dto.metadata } : thread.metadata;
    const updatedState = dto.state ? { ...thread.state, ...dto.state } : thread.state;

    return await this.threadRepository.update(id, {
      ...dto,
      metadata: updatedMetadata,
      state: updatedState,
    });
  }

  /**
   * 删除 Thread
   */
  async delete(id: string, teamId?: string): Promise<void> {
    await this.get(id, teamId); // 权限检查
    await this.threadRepository.delete(id);
  }

  /**
   * 更新 Thread 的 lastMessageAt
   */
  async touchThread(id: string): Promise<void> {
    await this.threadRepository.updateLastMessageAt(id);
  }

  /**
   * 更新 Thread 状态（用于可恢复运行）
   */
  async updateState(id: string, state: Partial<ThreadState>, teamId?: string): Promise<ThreadEntity> {
    return await this.update(id, { state }, teamId);
  }

  /**
   * 设置 Thread 运行状态
   */
  async setRunning(id: string, isRunning: boolean, teamId?: string): Promise<void> {
    await this.updateState(id, { isRunning }, teamId);
  }

  /**
   * 获取 Thread 的消息数量
   */
  async getMessageCount(id: string, teamId?: string): Promise<number> {
    await this.get(id, teamId); // 权限检查
    return await this.messageRepository.countByThreadId(id);
  }
}
