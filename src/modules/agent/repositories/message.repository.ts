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

  /**
   * 批量统计多个 thread 的消息数（避免 N+1）
   */
  async countByThreadIds(threadIds: string[]): Promise<Record<string, number>> {
    if (!threadIds || threadIds.length === 0) return {};

    const rows = await this.repository
      .createQueryBuilder('m')
      .select('m.threadId', 'threadId')
      .addSelect('COUNT(1)', 'count')
      .where('m.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('m.threadId IN (:...threadIds)', { threadIds })
      .groupBy('m.threadId')
      .getRawMany<{ threadId: string; count: string }>();

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.threadId] = Number(row.count) || 0;
    }
    return result;
  }
}
