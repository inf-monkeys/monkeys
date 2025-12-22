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
   * 将外部传入的 agentId 规范化为数据库中的真实 Agent ID
   *
   * - 如果传入的是数据库 ID：直接返回
   * - 如果传入的是默认 agent 标识符（如 "tldraw-assistant"）：映射/自动创建并返回其数据库 ID
   * - 其它情况：返回 null（表示不绑定 agent）
   */
  private async resolveAgentId(agentId: string, teamId: string, userId: string): Promise<string | null> {
    if (!agentId) return null;

    // 1) 优先认为它是数据库里的真实 ID
    const byId = await this.agentRepository.findById(agentId);
    if (byId) return byId.id;

    // 2) 再尝试认为它是默认 agent 的“标识符”
    try {
      const agent = await this.agentService.getOrCreateDefaultAgent(agentId, teamId, userId);
      return agent.id;
    } catch {
      return null;
    }
  }

  /**
   * 创建 Thread
   */
  async create(dto: CreateThreadDto): Promise<ThreadEntity> {
    // 如果指定了 agentId：既支持传入数据库 ID，也支持默认 agent 标识符（如 "tldraw-assistant"）
    const validatedAgentId = dto.agentId
      ? await this.resolveAgentId(dto.agentId, dto.teamId, dto.userId)
      : null;

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
      const resolved = await this.resolveAgentId(agentId, teamId, userId);
      if (!resolved) return [];
      return threads.filter((t) => t.agentId === resolved);
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
