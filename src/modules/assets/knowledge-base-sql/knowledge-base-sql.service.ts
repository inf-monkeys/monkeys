import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { CreateSqlKnowledgeBaseParams, SqlKnowledgeBaseRepository } from '@/database/repositories/knowledge-base-sql.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlKnowledgeBaseService {
  private KNOWLEDGE_BASE_NAMESPACE = 'monkey_tools_knowledge_base';

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
    }>(this.KNOWLEDGE_BASE_NAMESPACE, {
      url: '/sql-knowledge-bases',
      method: 'POST',
    });
    // Create knowledge base in database
    const { id } = data;
    return await this.sqlKnowledgeBaseRepository.createSqlKnowledgeBase(teamId, userId, id, params);
  }

  public async deleteSqlKnowledgeBase(teamId: string, uuid: string) {
    try {
      await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
        url: `/sql-knowledge-bases/${uuid}`,
        method: 'DELETE',
      });
    } catch (error) {
      logger.warn(`Failed to delete knowledge base in tools: ${error.message}`);
    }

    return await this.sqlKnowledgeBaseRepository.deleteSqlKnowledgeBase(teamId, uuid);
  }
}
