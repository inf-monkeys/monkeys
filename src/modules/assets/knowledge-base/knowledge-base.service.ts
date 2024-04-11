import { KnowledgeBaseRepository } from '@/database/repositories/knowledge-base.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KnowledgeBaseService {
  private KNOWLEDGE_BASE_NAMESPACE = 'monkey_tools_knowledge_base';

  constructor(
    private readonly textCollectionsRepository: KnowledgeBaseRepository,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  public async listKnowledgeBases(teamId: string) {
    return await this.textCollectionsRepository.listKnowledgeBases(teamId);
  }

  public async createKnowledgeBase(teamId: string, creatorUserId: string, body: any) {
    // Create knowledge base in tools
    const data = await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
      url: '/knowledge-bases',
      method: 'POST',
      data: body,
    });
    if (!data?.success) {
      throw new Error('Failed to create knowledge base');
    }
    // Create knowledge base in database
    const { name, dimension } = data;
    return await this.textCollectionsRepository.createKnowledgeBase(teamId, creatorUserId, {
      name,
      dimension,
      ...body,
    });
  }
}
