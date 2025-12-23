import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '@/database/entities/agents/agent.entity';
import { generateDbId } from '@/common/utils';

@Injectable()
export class AgentRepository {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly repository: Repository<AgentEntity>,
  ) {}

  async create(data: Partial<AgentEntity>): Promise<AgentEntity> {
    const agent = this.repository.create({
      id: generateDbId(),
      ...data,
    });
    return await this.repository.save(agent);
  }

  async findById(id: string): Promise<AgentEntity | null> {
    return await this.repository.findOne({
      where: { id, isDeleted: false },
    });
  }

  async findByTeamId(teamId: string): Promise<AgentEntity[]> {
    return await this.repository.find({
      where: { teamId, isDeleted: false },
      relations: ['creator', 'team'],
      order: { updatedTimestamp: 'DESC' },
    });
  }

  async findByNameAndTeam(name: string, teamId: string): Promise<AgentEntity | null> {
    return await this.repository.findOne({
      where: { name, teamId, isDeleted: false },
    });
  }

  async update(id: string, data: Partial<AgentEntity>): Promise<AgentEntity> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }
}
