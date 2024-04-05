import { KnowledgeBaseRepository } from '@/database/repositories/knowledge-base.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly textCollectionsRepository: KnowledgeBaseRepository) {}

  public async listKnowledgeBases(teamId: string) {
    return await this.textCollectionsRepository.listKnowledgeBases(teamId);
  }
}
