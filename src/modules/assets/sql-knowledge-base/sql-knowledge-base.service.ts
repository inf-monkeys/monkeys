import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { CreateSqlKnowledgeBaseParams } from '@/database/entities/assets/knowledge-base/knowledge-base-sql.entity';
import { SqlKnowledgeBaseRepository } from '@/database/repositories/knowledge-base-sql.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_BASE_NAMESPACE } from '../consts';

@Injectable()
export class SqlKnowledgeBaseService {
  constructor(
    private readonly sqlKnowledgeBaseRepository: SqlKnowledgeBaseRepository,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  public async listSqlKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.sqlKnowledgeBaseRepository.listSqlKnowledgeBases(teamId, dto);
  }

  public async createSqlKnowledgeBase(teamId: string, userId: string, params: CreateSqlKnowledgeBaseParams) {
    const data = await this.toolsForwardService.request<{
      id: string;
      dimension: number;
    }>(KNOWLEDGE_BASE_NAMESPACE, {
      url: '/sql-knowledge-bases/',
      method: 'POST',
      data: params,
    });
    // Create knowledge base in database
    const { id } = data;
    return await this.sqlKnowledgeBaseRepository.createSqlKnowledgeBase(teamId, userId, id, params);
  }

  public async deleteSqlKnowledgeBase(teamId: string, uuid: string) {
    try {
      await this.toolsForwardService.request(KNOWLEDGE_BASE_NAMESPACE, {
        url: `/sql-knowledge-bases/${uuid}`,
        method: 'DELETE',
      });
    } catch (error) {
      logger.warn(`Failed to delete knowledge base in tools: ${error.message}`);
    }

    return await this.sqlKnowledgeBaseRepository.deleteSqlKnowledgeBase(teamId, uuid);
  }

  public async getSqlKnowledgeBaseByUUID(teamId: string, uuid: string) {
    return await this.sqlKnowledgeBaseRepository.getSqlKnowledgeBaseByUUID(teamId, uuid);
  }

  public async getCreateTableStatements(sqlKnowledgeBaseUuid: string) {
    const { tables } = await this.toolsForwardService.request<{
      tables: Array<{
        name: string;
        sql: string;
      }>;
    }>(KNOWLEDGE_BASE_NAMESPACE, {
      url: `/sql-knowledge-bases/${sqlKnowledgeBaseUuid}/tables`,
      method: 'GET',
    });
    return tables;
  }
}
