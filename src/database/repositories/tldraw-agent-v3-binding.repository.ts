import { generateDbId } from '@/common/utils';
import { TldrawAgentV3BindingEntity } from '@/database/entities/agent-v3/tldraw-agent-v3-binding.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TldrawAgentV3BindingRepository {
  constructor(
    @InjectRepository(TldrawAgentV3BindingEntity)
    private readonly repo: Repository<TldrawAgentV3BindingEntity>,
  ) {}

  async findByBoard(boardId: string, teamId: string) {
    return this.repo.findOne({
      where: {
        boardId,
        teamId,
        isDeleted: false,
      },
    });
  }

  async findBySession(sessionId: string, teamId: string) {
    return this.repo.findOne({
      where: {
        sessionId,
        teamId,
        isDeleted: false,
      },
    });
  }

  async createBinding(params: { boardId: string; teamId: string; userId: string; sessionId: string }) {
    const entity: TldrawAgentV3BindingEntity = {
      id: generateDbId(),
      boardId: params.boardId,
      teamId: params.teamId,
      userId: params.userId,
      sessionId: params.sessionId,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    await this.repo.insert(entity);
    return entity;
  }
}
