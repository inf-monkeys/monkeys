import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThreadEntity } from '@/database/entities/agents/thread.entity';
import { generateDbId } from '@/common/utils';

@Injectable()
export class ThreadRepository {
  constructor(
    @InjectRepository(ThreadEntity)
    private readonly repository: Repository<ThreadEntity>,
  ) {}

  async create(data: Partial<ThreadEntity>): Promise<ThreadEntity> {
    const thread = this.repository.create({
      id: generateDbId(),
      ...data,
    });
    return await this.repository.save(thread);
  }

  async findById(id: string): Promise<ThreadEntity | null> {
    return await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: ['agent'],
    });
  }

  async findByUserId(userId: string, teamId: string): Promise<ThreadEntity[]> {
    return await this.repository.find({
      where: { userId, teamId, isDeleted: false },
      order: { lastMessageAt: 'DESC' },
      relations: ['agent'],
    });
  }

  async findByAgentId(agentId: string): Promise<ThreadEntity[]> {
    return await this.repository.find({
      where: { agentId, isDeleted: false },
      order: { lastMessageAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<ThreadEntity>): Promise<ThreadEntity> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async updateLastMessageAt(id: string): Promise<void> {
    await this.repository.update(id, { lastMessageAt: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }
}
