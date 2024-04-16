import { ListDto } from '@/common/dto/list.dto';
import { KnowledgeBaseRepository } from '@/database/repositories/knowledge-base.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KnowledgeBaseService {
  private KNOWLEDGE_BASE_NAMESPACE = 'monkey_tools_knowledge_base';

  constructor(
    private readonly knowledgeBaseRepository: KnowledgeBaseRepository,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  public async listKnowledgeBases(teamId: string, dto: ListDto) {
    return await this.knowledgeBaseRepository.listKnowledgeBases(teamId, dto);
  }

  public async getKnowledgeBaseByName(teamId: string, knowledgeBaseName: string) {
    return await this.knowledgeBaseRepository.getKnowledgeBaseByName(teamId, knowledgeBaseName);
  }

  public async createKnowledgeBase(teamId: string, creatorUserId: string, body: any) {
    // Create knowledge base in tools
    const data = await this.toolsForwardService.request<{
      id: string;
      dimension: number;
    }>(this.KNOWLEDGE_BASE_NAMESPACE, {
      url: '/knowledge-bases',
      method: 'POST',
      data: body,
    });
    // Create knowledge base in database
    const { id, dimension } = data;
    return await this.knowledgeBaseRepository.createKnowledgeBase(teamId, creatorUserId, {
      name: id,
      dimension,
      ...body,
    });
  }

  public async updateKnowledgeBase(
    teamId: string,
    knowledgeBaseName: string,
    updates: {
      displayName?: string;
      description?: string;
      iconUrl?: string;
    },
  ) {
    return await this.knowledgeBaseRepository.updateKnowledgeBase(teamId, knowledgeBaseName, updates);
  }

  public async deleteKnowledgeBase(teamId: string, knowledgeBaseName: string) {
    // Delete knowledge base in tools
    await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
      url: `/knowledge-bases/${knowledgeBaseName}`,
      method: 'DELETE',
    });
    // Delete knowledge base in database
    await this.knowledgeBaseRepository.deleteKnowledgeBase(teamId, knowledgeBaseName);
  }
}
