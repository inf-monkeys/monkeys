import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { KnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base.entity';
import { AssetsCommonRepository } from './assets-common.repository';

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
    private readonly assetsCommonRepository: AssetsCommonRepository,
  ) {}

  public async listKnowledgeBases(teamId: string) {
    let result: KnowLedgeBaseEntity[] = [];
    const teamOwned = await this.knowledgeBaseRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
    result = result.concat(teamOwned);
    const authorizedIds = await this.assetsCommonRepository.listAuthorizedAssetIds(teamId, 'knowledge-base');
    if (authorizedIds) {
      const authorized = await this.knowledgeBaseRepository.find({
        where: {
          id: In(authorizedIds),
          isDeleted: false,
        },
      });
      result = result.concat(authorized);
    }
    return result;
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
    const result = await this.knowledgeBaseRepository.save(knowledgeBase);
    return result;
  }
}
