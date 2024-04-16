import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base.entity';
import { KnowledgeBaseAssetRepositroy } from './assets-knowledge-base.repository';

export interface CreateKnowledgeBaseParams {
  name: string;
  displayName: string;
  description: string;
  embeddingModel: string;
  iconUrl: string;
  dimension: number;
}

@Injectable()
export class KnowledgeBaseRepository {
  constructor(
    @InjectRepository(KnowLedgeBaseEntity)
    private readonly knowledgeBaseRepository: Repository<KnowLedgeBaseEntity>,
    private readonly knowledgeBaseAssetRepositroy: KnowledgeBaseAssetRepositroy,
  ) {}

  public async listKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.knowledgeBaseAssetRepositroy.listAssets('knowledge-base', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async createKnowledgeBase(teamId: string, creatorUserId: string, params: CreateKnowledgeBaseParams) {
    const knowledgeBase = new KnowLedgeBaseEntity();
    knowledgeBase.id = generateDbId();
    knowledgeBase.teamId = teamId;
    knowledgeBase.name = params.name;
    knowledgeBase.dimension = params.dimension;
    knowledgeBase.creatorUserId = creatorUserId;
    knowledgeBase.displayName = params.displayName;
    knowledgeBase.description = params.description;
    knowledgeBase.embeddingModel = params.embeddingModel;
    knowledgeBase.iconUrl = params.iconUrl;
    knowledgeBase.createdTimestamp = Date.now();
    knowledgeBase.updatedTimestamp = Date.now();
    const result = await this.knowledgeBaseRepository.save(knowledgeBase);
    return result;
  }

  public async getKnowledgeBaseByName(teamId: string, knowledgeBaseName: string) {
    return await this.knowledgeBaseRepository.findOne({
      where: {
        name: knowledgeBaseName,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async updateKnowledgeBase(
    teamId: string,
    knowledgeBaseName: string,
    updates: {
      displayName?: string;
      description?: string;
      iconUrl?: string;
    },
  ) {
    const knowledgeBase = await this.getKnowledgeBaseByName(teamId, knowledgeBaseName);
    if (!knowledgeBase) {
      return null;
    }
    if (updates.displayName) {
      knowledgeBase.displayName = updates.displayName;
    }
    if (updates.description) {
      knowledgeBase.description = updates.description;
    }
    if (updates.iconUrl) {
      knowledgeBase.iconUrl = updates.iconUrl;
    }
    knowledgeBase.updatedTimestamp = Date.now();
    return await this.knowledgeBaseRepository.save(knowledgeBase);
  }

  public async deleteKnowledgeBase(teamId: string, knowledgeBaseName: string) {
    const knowledgeBase = await this.getKnowledgeBaseByName(teamId, knowledgeBaseName);
    if (!knowledgeBase) {
      return;
    }
    knowledgeBase.isDeleted = true;
    knowledgeBase.updatedTimestamp = Date.now();
    await this.knowledgeBaseRepository.save(knowledgeBase);
  }
}
