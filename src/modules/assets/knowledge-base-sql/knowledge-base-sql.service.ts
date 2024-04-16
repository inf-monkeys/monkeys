import { ListDto } from '@/common/dto/list.dto';
import { SqlKnowledgeBaseRepository } from '@/database/repositories/knowledge-base-sql.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KnowledgeBaseSqlService {
  constructor(private readonly sqlKnowledgeBaseRepository: SqlKnowledgeBaseRepository) {}

  public async listSqlKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.sqlKnowledgeBaseRepository.listSqlKnowledgeBases(teamId, dto);
  }
}
