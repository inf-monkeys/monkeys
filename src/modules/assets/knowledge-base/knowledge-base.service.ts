import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { KnowledgeBaseRetrievalMode, KnowledgeBaseRetrievalSettings } from '@/database/entities/assets/knowledge-base/knowledge-base.entity';
import { KnowledgeBaseRepository } from '@/database/repositories/knowledge-base.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';
import { CreateKnowledgeBaseDto } from './dto/req/create-knowledge-base.req.dto';

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

  public async getKnowledgeBaseByName(teamId: string, knowledgeBaseId: string) {
    return await this.knowledgeBaseRepository.getKnowledgeBaseByUUID(teamId, knowledgeBaseId);
  }

  public async createKnowledgeBase(teamId: string, creatorUserId: string, body: CreateKnowledgeBaseDto) {
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
      uuid: id,
      dimension,
      ...body,
    });
  }

  public async updateKnowledgeBase(
    teamId: string,
    knowledgeBaseId: string,
    updates: {
      displayName?: string;
      description?: string;
      iconUrl?: string;
      retrievalSettings?: KnowledgeBaseRetrievalSettings;
    },
  ) {
    return await this.knowledgeBaseRepository.updateKnowledgeBase(teamId, knowledgeBaseId, updates);
  }

  public async deleteKnowledgeBase(teamId: string, knowledgeBaseId: string) {
    // Delete knowledge base in tools
    try {
      await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
        url: `/knowledge-bases/${knowledgeBaseId}`,
        method: 'DELETE',
      });
    } catch (error) {
      logger.warn(`Failed to delete knowledge base in tools: ${error.message}`);
    }

    // Delete knowledge base in database
    await this.knowledgeBaseRepository.deleteKnowledgeBase(teamId, knowledgeBaseId);
  }

  public async retrieveKnowledgeBase(
    knowledgeBaseId: string,
    query: string,
  ): Promise<{
    hits: Array<{
      page_content: string;
      metadata: { [x: string]: any };
      pk: string;
    }>;
    text: string;
  }> {
    const knowledgeBase = await this.knowledgeBaseRepository.getKnowledgeBaseByUUIDWithoutTeam(knowledgeBaseId);
    const retrievalSettings = knowledgeBase.getRetrievalSettings();

    switch (retrievalSettings.mode) {
      case KnowledgeBaseRetrievalMode.VectorSearch:
        return await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
          url: `/knowledge-bases/${knowledgeBaseId}/vector-search`,
          method: 'POST',
          data: {
            query: query,
            topK: retrievalSettings.topK,
            scoreThreshHold: retrievalSettings.scoreThreshHold,
          },
        });
      case KnowledgeBaseRetrievalMode.FullTextSearch:
        return await this.toolsForwardService.request(this.KNOWLEDGE_BASE_NAMESPACE, {
          url: `/knowledge-bases/${knowledgeBaseId}/fulltext-search`,
          method: 'POST',
          data: {
            query: query,
            from: 0,
            size: retrievalSettings.topK,
          },
        });
      default:
        break;
    }
  }
}
