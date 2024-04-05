import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { KnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base.entity';
import { AssetsCommonRepository } from './assets-common.repository';

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
}
