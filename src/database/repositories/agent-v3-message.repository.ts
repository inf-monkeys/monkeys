import { AgentV3MessageEntity } from '@/database/entities/agent-v3/agent-v3-message.entity';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

@Injectable()
export class AgentV3MessageRepository {
  constructor(
    @InjectRepository(AgentV3MessageEntity)
    private readonly repo: Repository<AgentV3MessageEntity>,
  ) {}

  async getNextSequence(sessionId: string, teamId: string) {
    const last = await this.repo.findOne({
      where: { sessionId, teamId },
      order: { sequence: 'DESC' },
    });
    return (last?.sequence ?? 0) + 1;
  }

  async insertMessage(partial: Omit<AgentV3MessageEntity, 'id' | 'createdTimestamp' | 'updatedTimestamp' | 'isDeleted'>) {
    const now = Date.now();
    const entity: AgentV3MessageEntity = {
      ...partial,
      id: generateDbId(),
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    };
    await this.repo.insert(entity);
    return entity;
  }

  async listMessages(sessionId: string, teamId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;
    const findOptions: FindManyOptions<AgentV3MessageEntity> = {
      where: {
        sessionId,
        teamId,
        isDeleted: false,
      },
      order: { sequence: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    };
    const [data, total] = await this.repo.findAndCount(findOptions);
    return { data, total, page, limit };
  }

  async listAllForSession(sessionId: string, teamId: string) {
    return this.repo.find({
      where: {
        sessionId,
        teamId,
        isDeleted: false,
      },
      order: {
        sequence: 'ASC',
      },
    });
  }
}
