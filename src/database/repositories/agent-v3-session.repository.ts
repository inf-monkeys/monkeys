import { AgentV3SessionEntity } from '@/database/entities/agent-v3/agent-v3-session.entity';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AgentV3SessionRepository {
  constructor(
    @InjectRepository(AgentV3SessionEntity)
    private readonly repo: Repository<AgentV3SessionEntity>,
  ) {}

  async createSession(teamId: string, userId: string, data: { title?: string; modelId?: string }) {
    const id = generateDbId();
    const entity: AgentV3SessionEntity = {
      id,
      teamId,
      userId,
      title: data.title,
      modelId: data.modelId,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    await this.repo.insert(entity);
    return this.getById(teamId, userId, id);
  }

  async getById(teamId: string, userId: string, id: string) {
    return this.repo.findOne({
      where: {
        id,
        teamId,
        userId,
        isDeleted: false,
      },
    });
  }

  async listByUser(teamId: string, userId: string) {
    return this.repo.find({
      where: {
        teamId,
        userId,
        isDeleted: false,
      },
      order: {
        updatedTimestamp: 'DESC',
      },
    });
  }

  async updateSession(teamId: string, userId: string, id: string, updates: { title?: string | null; modelId?: string | null }) {
    const payload: Partial<AgentV3SessionEntity> = {
      updatedTimestamp: Date.now(),
    };
    if (typeof updates.title !== 'undefined') {
      payload.title = updates.title ?? null;
    }
    if (typeof updates.modelId !== 'undefined') {
      payload.modelId = updates.modelId ?? null;
    }
    await this.repo.update(
      {
        id,
        teamId,
        userId,
        isDeleted: false,
      },
      payload,
    );
    return this.getById(teamId, userId, id);
  }

  async softDelete(teamId: string, userId: string, id: string) {
    await this.repo.update(
      {
        id,
        teamId,
        userId,
        isDeleted: false,
      },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      },
    );
  }
}
