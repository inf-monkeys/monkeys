import { ListDto } from '@/common/dto/list.dto';
import { logger } from '@/common/logger';
import { KnowledgeBaseRetrievalMode, KnowledgeBaseRetrievalSettings } from '@/database/entities/assets/knowledge-base/knowledge-base.entity';
import { KnowledgeBaseRepository } from '@/database/repositories/knowledge-base.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_BASE_NAMESPACE } from '../consts';
import { CreateKnowledgeBaseDto } from './dto/req/create-knowledge-base.req.dto';

@Injectable()
export class KnowledgeBaseService {
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
    }>(KNOWLEDGE_BASE_NAMESPACE, {
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
      await this.toolsForwardService.request(KNOWLEDGE_BASE_NAMESPACE, {
        url: `/knowledge-bases/${knowledgeBaseId}`,
        method: 'DELETE',
      });
    } catch (error) {
      logger.warn(`Failed to delete knowledge base in tools: ${error.message}`);
    }

    // Delete knowledge base in database
    await this.knowledgeBaseRepository.deleteKnowledgeBase(teamId, knowledgeBaseId);
    return {
      success: true,
    };
  }

  public async getUniqueMetadataValueByKey(knowledgeBaseId: string, key: string) {
    const { list } = await this.toolsForwardService.request<{
      list: string[];
    }>(KNOWLEDGE_BASE_NAMESPACE, {
      url: `/knowledge-bases/${knowledgeBaseId}/metadata-fields/${key}/values`,
      method: 'GET',
    });
    return list;
  }

  public async valuesToFilterByMetadataKey(knowledgeBaseId: string): Promise<string[]> {
    const knowledgeBase = await this.knowledgeBaseRepository.getKnowledgeBaseByUUIDWithoutTeam(knowledgeBaseId);
    const retrievalSettings = knowledgeBase.getRetrievalSettings();
    if (!retrievalSettings.enabledMetadataFilter) {
      return [];
    }
    const { metadataFilterKey } = retrievalSettings;
    return await this.getUniqueMetadataValueByKey(knowledgeBaseId, metadataFilterKey);
  }

  public async retrieveKnowledgeBase(
    knowledgeBaseId: string,
    query: string,
    metadataFilterValues?: string[],
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
        const body = {
          query: query,
          topK: retrievalSettings.topK,
          scoreThreshHold: retrievalSettings.scoreThreshHold,
        };
        if (retrievalSettings.enabledMetadataFilter && metadataFilterValues?.length) {
          body['metadata_filter'] = {
            [retrievalSettings.metadataFilterKey]: metadataFilterValues,
          };
        }
        return await this.toolsForwardService.request(KNOWLEDGE_BASE_NAMESPACE, {
          url: `/knowledge-bases/${knowledgeBaseId}/vector-search`,
          method: 'POST',
          data: body,
        });
      case KnowledgeBaseRetrievalMode.FullTextSearch:
        return await this.toolsForwardService.request(KNOWLEDGE_BASE_NAMESPACE, {
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
