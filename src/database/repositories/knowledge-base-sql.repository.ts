import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSqlKnowledgeBaseParams, SqlKnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base-sql.entity';
import { SqlKnowledgeBaseAssetRepositroy } from './assets-knowledge-base-sql.repository';

@Injectable()
export class SqlKnowledgeBaseRepository {
  constructor(
    @InjectRepository(SqlKnowLedgeBaseEntity)
    private readonly sqlKnowledgeBaseRepository: Repository<SqlKnowLedgeBaseEntity>,
    private readonly sqlKnowledgeBaseAssetRepositroy: SqlKnowledgeBaseAssetRepositroy,
  ) {}

  public async listSqlKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.sqlKnowledgeBaseAssetRepositroy.listAssets('sql-knowledge-base', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async createSqlKnowledgeBase(teamId: string, userId: string, uuid: string, params: CreateSqlKnowledgeBaseParams) {
    const sqlKnowledgeBase = new SqlKnowLedgeBaseEntity();
    sqlKnowledgeBase.id = generateDbId();
    sqlKnowledgeBase.uuid = uuid;
    sqlKnowledgeBase.displayName = params.displayName || params.externalDatabaseConnectionOptions?.database || 'Unknown';
    sqlKnowledgeBase.description = params.description || '';
    sqlKnowledgeBase.iconUrl = params.iconUrl || 'emoji:🍀:#ceefc5';
    sqlKnowledgeBase.teamId = teamId;
    sqlKnowledgeBase.creatorUserId = userId;
    sqlKnowledgeBase.createdTimestamp = +new Date();
    sqlKnowledgeBase.updatedTimestamp = +new Date();
    sqlKnowledgeBase.isDeleted = false;
    sqlKnowledgeBase.createType = params.createType;
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
