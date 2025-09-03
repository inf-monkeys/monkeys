import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentV2MessageEntity } from '../../../database/entities/agent-v2/agent-v2-message.entity';
import { AgentV2SessionEntity } from '../../../database/entities/agent-v2/agent-v2-session.entity';
import { AgentV2MessageQueueEntity, AgentV2TaskStateEntity } from '../../../database/entities/agent-v2/agent-v2-task-state.entity';
import { AgentV2Entity } from '../../../database/entities/agent-v2/agent-v2.entity';

@Injectable()
export class AgentV2Repository {
  constructor(
    @InjectRepository(AgentV2Entity)
    private readonly agentRepo: Repository<AgentV2Entity>,
    @InjectRepository(AgentV2SessionEntity)
    private readonly sessionRepo: Repository<AgentV2SessionEntity>,
    @InjectRepository(AgentV2MessageEntity)
    private readonly messageRepo: Repository<AgentV2MessageEntity>,
    @InjectRepository(AgentV2TaskStateEntity)
    private readonly taskStateRepo: Repository<AgentV2TaskStateEntity>,
    @InjectRepository(AgentV2MessageQueueEntity)
    private readonly messageQueueRepo: Repository<AgentV2MessageQueueEntity>,
  ) {}

  async createAgent(data: Partial<AgentV2Entity>): Promise<AgentV2Entity> {
    const agent = this.agentRepo.create({
      id: generateDbId(),
      ...data,
    });
    return await this.agentRepo.save(agent);
  }

  async findAgentById(id: string): Promise<AgentV2Entity | null> {
    return this.agentRepo.findOne({ where: { id } });
  }

  async findAgentsByTeam(teamId: string, options: { page?: number; limit?: number; search?: string } = {}): Promise<{ agents: AgentV2Entity[]; total: number }> {
    const { page = 1, limit = 10, search } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.agentRepo.createQueryBuilder('agent').where('agent.teamId = :teamId', { teamId }).orderBy('agent.createdTimestamp', 'DESC');

    if (search) {
      queryBuilder.andWhere('(agent.name ILIKE :search OR agent.description ILIKE :search)', { search: `%${search}%` });
    }

    const [agents, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { agents, total };
  }

  async createSession(data: Partial<AgentV2SessionEntity>): Promise<AgentV2SessionEntity> {
    const session = this.sessionRepo.create({
      id: generateDbId(),
      ...data,
    });
    return await this.sessionRepo.save(session);
  }

  async findSessionById(id: string): Promise<AgentV2SessionEntity | null> {
    return this.sessionRepo.findOne({ where: { id } });
  }

  async findSessionsByAgentAndUser(agentId: string, userId: string, options: { page?: number; limit?: number } = {}): Promise<{ sessions: AgentV2SessionEntity[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [sessions, total] = await this.sessionRepo.findAndCount({
      where: { agentId, userId },
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return { sessions, total };
  }

  async createMessage(data: Partial<AgentV2MessageEntity>): Promise<AgentV2MessageEntity> {
    const message = this.messageRepo.create({
      id: generateDbId(),
      ...data,
    });
    return await this.messageRepo.save(message);
  }

  async updateMessage(messageId: string, updates: Partial<AgentV2MessageEntity>): Promise<AgentV2MessageEntity> {
    await this.messageRepo.update(messageId, updates);
    const updatedMessage = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!updatedMessage) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    return updatedMessage;
  }

  async findMessagesBySession(sessionId: string, options: { page?: number; limit?: number } = {}): Promise<{ messages: AgentV2MessageEntity[]; total: number }> {
    if (!options.page || !options.limit) {
      // Return all messages if no pagination options
      const messages = await this.messageRepo.find({
        where: { sessionId },
        order: { id: 'ASC' },
      });
      return { messages, total: messages.length };
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { sessionId },
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { messages, total };
  }

  async getTaskState(sessionId: string): Promise<AgentV2TaskStateEntity | null> {
    return this.taskStateRepo.findOne({ where: { sessionId } });
  }

  async getSessionQueueInfo(sessionId: string): Promise<{
    totalQueued: number;
    totalProcessing: number;
    totalProcessed: number;
    totalFailed: number;
    oldestUnprocessed: Date | null;
    newestMessage: Date | null;
  }> {
    const queueStats = await this.messageQueueRepo
      .createQueryBuilder('queue')
      .select('queue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MIN(queue.createdAt)', 'oldest')
      .addSelect('MAX(queue.createdAt)', 'newest')
      .where('queue.sessionId = :sessionId', { sessionId })
      .groupBy('queue.status')
      .getRawMany();

    const result = {
      totalQueued: 0,
      totalProcessing: 0,
      totalProcessed: 0,
      totalFailed: 0,
      oldestUnprocessed: null as Date | null,
      newestMessage: null as Date | null,
    };

    queueStats.forEach((stat) => {
      const count = parseInt(stat.count);
      switch (stat.status) {
        case 'queued':
          result.totalQueued = count;
          break;
        case 'processing':
          result.totalProcessing = count;
          break;
        case 'processed':
          result.totalProcessed = count;
          break;
        case 'failed':
          result.totalFailed = count;
          break;
      }

      if (stat.oldest && (!result.oldestUnprocessed || stat.oldest < result.oldestUnprocessed)) {
        result.oldestUnprocessed = new Date(stat.oldest);
      }
      if (stat.newest && (!result.newestMessage || stat.newest > result.newestMessage)) {
        result.newestMessage = new Date(stat.newest);
      }
    });

    return result;
  }
}
