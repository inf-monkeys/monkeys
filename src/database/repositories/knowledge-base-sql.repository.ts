import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqlKnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base-sql.entity';
import { SqlKnowledgeBaseAssetRepositroy } from './assets-knowledge-base-sql.repository';

export interface CreateSqlKnowledgeBaseParams {
  displayName: string;
  description?: string;
  iconUrl?: string;
}

@Injectable()
export class SqlKnowledgeBaseRepository {
  constructor(
    @InjectRepository(SqlKnowLedgeBaseEntity)
    private readonly sqlKnowledgeBaseRepository: Repository<SqlKnowLedgeBaseEntity>,
    private readonly sqlKnowledgeBaseAssetRepositroy: SqlKnowledgeBaseAssetRepositroy,
  ) {}

  public async listSqlKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.sqlKnowledgeBaseAssetRepositroy.listAssets('knowledge-base-sql', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async createSqlKnowledgeBase(teamId: string, userId: string, uuid: string, params: CreateSqlKnowledgeBaseParams) {
    const sqlKnowledgeBase = new SqlKnowLedgeBaseEntity();
    sqlKnowledgeBase.id = generateDbId();
    sqlKnowledgeBase.uuid = uuid;
    sqlKnowledgeBase.displayName = params.displayName;
    sqlKnowledgeBase.description = params.description;
    sqlKnowledgeBase.iconUrl = params.iconUrl;
    sqlKnowledgeBase.teamId = teamId;
    sqlKnowledgeBase.creatorUserId = userId;
    sqlKnowledgeBase.createdTimestamp = +new Date();
    sqlKnowledgeBase.updatedTimestamp = +new Date();
    sqlKnowledgeBase.isDeleted = false;
    return await this.sqlKnowledgeBaseRepository.save(sqlKnowledgeBase);
  }

  public async getSqlKnowledgeBaseByUUID(teamId: string, uuid: string) {
    return await this.sqlKnowledgeBaseRepository.findOne({
      where: {
        uuid,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async deleteSqlKnowledgeBase(teamId: string, uuid: string) {
    const knowledgeBase = await this.getSqlKnowledgeBaseByUUID(teamId, uuid);
    if (!knowledgeBase) {
      return;
    }
    knowledgeBase.isDeleted = true;
    knowledgeBase.updatedTimestamp = Date.now();
    await this.sqlKnowledgeBaseRepository.save(knowledgeBase);
  }
}
