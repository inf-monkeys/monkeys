import { LlmModelEndpointType } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationAppEntity, CreateConversationAppParams, UpdateConversationAppParams } from '../entities/conversation-app/conversation-app.entity';
import { ConversationAppAssetRepositroy } from './assets-conversation-app.repository';

@Injectable()
export class ConversationAppRepository {
  constructor(
    @InjectRepository(ConversationAppEntity)
    private readonly repository: Repository<ConversationAppEntity>,
    private readonly assetRepository: ConversationAppAssetRepositroy,
  ) {}

  public async listConversationApps(teamId: string, dto: ListDto) {
    return await this.assetRepository.listAssets('conversation-app', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  private checkModel(model: string) {
    const avaliableModels = getModels(LlmModelEndpointType.CHAT_COMPLETIONS);
    if (!avaliableModels.map((x) => x.name).includes(model)) {
      throw new Error(`Model ${model} is not available`);
    }
  }

  private async checkCustomModelUnique(teamId: string, customModelName: string) {
    const entity = await this.repository.findOne({
      where: {
        teamId,
        customModelName,
        isDeleted: false,
      },
    });
    if (entity) {
      throw new Error('Custom model name must be unique');
    }
  }

  public async createConversationApp(teamId: string, userId: string, params: CreateConversationAppParams) {
    const { model } = params;

    if (!model) {
      throw new Error('Model is required');
    }

    this.checkModel(model);

    if (params.customModelName) {
      await this.checkCustomModelUnique(teamId, params.customModelName);
    }

    const entity = new ConversationAppEntity();
    entity.id = generateDbId();
    entity.displayName = params.displayName;
    entity.description = params.description || '';
    entity.iconUrl = params.iconUrl || 'emoji:🍀:#ceefc5';
    entity.teamId = teamId;
    entity.creatorUserId = userId;
    entity.createdTimestamp = +new Date();
    entity.updatedTimestamp = +new Date();
    entity.isDeleted = false;
    entity.model = params.model;
    entity.systemPrompt = params.systemPrompt;
    entity.knowledgeBase = params.knowledgeBase;
    entity.sqlKnowledgeBase = params.sqlKnowledgeBase;
    entity.tools = params.tools;
    entity.temperature = params.temperature;
    entity.presence_penalty = params.presence_penalty;
    entity.frequency_penalty = params.frequency_penalty;
    entity.customModelName = params.customModelName;
    return await this.repository.save(entity);
  }

  public async getConversationAppById(teamId: string, id: string) {
    return await this.repository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async getConversationAppByCustomModelName(teamId: string, customModelName: string) {
    return await this.repository.findOne({
      where: {
        customModelName,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async deleteConversationApp(teamId: string, id: string) {
    const entity = await this.getConversationAppById(teamId, id);
    if (!entity) {
      return;
    }
    entity.isDeleted = true;
    entity.updatedTimestamp = Date.now();
    await this.repository.save(entity);
  }

  public async updateConversationApp(teamId: string, id: string, updates: UpdateConversationAppParams) {
    const entity = await this.getConversationAppById(teamId, id);
    if (!entity) {
      return null;
    }
    if (updates.displayName) {
      entity.displayName = updates.displayName;
    }
    if (updates.description) {
      entity.description = updates.description;
    }
    if (updates.iconUrl) {
      entity.iconUrl = updates.iconUrl;
    }
    if (updates.model) {
      this.checkModel(updates.model);
      entity.model = updates.model;
    }
    if (updates.customModelName) {
      if (updates.customModelName !== entity.customModelName) {
        await this.checkCustomModelUnique(teamId, updates.customModelName);
      }
      entity.customModelName = updates.customModelName;
    }
    if (updates.systemPrompt) {
      entity.systemPrompt = updates.systemPrompt;
    }
    if (updates.knowledgeBase) {
      entity.knowledgeBase = updates.knowledgeBase;
    }
    if (updates.sqlKnowledgeBase) {
      entity.sqlKnowledgeBase = updates.sqlKnowledgeBase;
    }
    if (updates.tools) {
      entity.tools = updates.tools;
    }
    if (updates.temperature != undefined) {
      entity.temperature = updates.temperature;
    }
    if (updates.presence_penalty != undefined) {
      entity.presence_penalty = updates.presence_penalty;
    }
    if (updates.frequency_penalty != undefined) {
      entity.frequency_penalty = updates.frequency_penalty;
    }
    entity.updatedTimestamp = Date.now();
    return await this.repository.save(entity);
  }
}
