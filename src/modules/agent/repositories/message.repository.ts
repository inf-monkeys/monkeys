import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '@/database/entities/agents/message.entity';
import { generateDbId } from '@/common/utils';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repository: Repository<MessageEntity>,
  ) {}

  async create(data: Partial<MessageEntity>): Promise<MessageEntity> {
    const message = this.repository.create({
      id: generateDbId(),
      ...data,
    });
    return await this.repository.save(message);
  }

  async findById(id: string): Promise<MessageEntity | null> {
    return await this.repository.findOne({
      where: { id, isDeleted: false },
    });
  }

  async findByThreadId(threadId: string): Promise<MessageEntity[]> {
    return await this.repository.find({
      where: { threadId, isDeleted: false },
      order: { createdTimestamp: 'ASC' },
    });
  }

  async findByThreadIdWithPagination(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<MessageEntity[]> {
    return await this.repository.find({
      where: { threadId, isDeleted: false },
      order: { createdTimestamp: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async findByParentId(parentId: string): Promise<MessageEntity[]> {
    return await this.repository.find({
      where: { parentId, isDeleted: false },
      order: { createdTimestamp: 'ASC' },
    });
  }

  async update(id: string, data: Partial<MessageEntity>): Promise<MessageEntity> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }

  async countByThreadId(threadId: string): Promise<number> {
    return await this.repository.count({
      where: { threadId, isDeleted: false },
    });
  }
}
