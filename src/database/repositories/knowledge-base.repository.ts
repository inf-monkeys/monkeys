import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base.entity';
import { KnowledgeBaseAssetRepositroy } from './assets-knowledge-base.repository';

export interface CreateKnowledgeBaseParams {
  uuid: string;
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
    knowledgeBase.uuid = params.uuid;
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

  public async getKnowledgeBaseByUUID(teamId: string, knowledgeBaseId: string) {
    return await this.knowledgeBaseRepository.findOne({
      where: {
        uuid: knowledgeBaseId,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async updateKnowledgeBase(
    teamId: string,
    knowledgeBaseId: string,
    updates: {
      displayName?: string;
      description?: string;
      iconUrl?: string;
    },
  ) {
    const knowledgeBase = await this.getKnowledgeBaseByUUID(teamId, knowledgeBaseId);
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

  public async deleteKnowledgeBase(teamId: string, knowledgeBaseId: string) {
    const knowledgeBase = await this.getKnowledgeBaseByUUID(teamId, knowledgeBaseId);
    if (!knowledgeBase) {
      return;
    }
    knowledgeBase.isDeleted = true;
    knowledgeBase.updatedTimestamp = Date.now();
    await this.knowledgeBaseRepository.save(knowledgeBase);
  }
}
