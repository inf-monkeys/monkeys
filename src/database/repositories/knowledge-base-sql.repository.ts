import { ListDto } from '@/common/dto/list.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqlKnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base-sql.entity';
import { SqlKnowledgeBaseAssetRepositroy } from './assets-knowledge-base-sql.repository';

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
}
