import { ListDto } from '@/common/dto/list.dto';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmModelEntity, LlmOneapiModel, UpdateLlmModelParams } from '../entities/assets/model/llm-model/llm-model';
import { LlmModelAssetRepositroy } from './assets-llm-model.respository';

@Injectable()
export class LlmModelRepository {
  constructor(
    private readonly llmModelAssetRepositroy: LlmModelAssetRepositroy,
    @InjectRepository(LlmModelEntity) private readonly llmModelRepository: Repository<LlmModelEntity>,
  ) {}

  public async deleteLLMModel(teamId: string, id: string) {
    await this.llmModelRepository.update(
      {
        teamId,
        isDeleted: false,
        id,
      },
      {
        isDeleted: true,
        updatedTimestamp: +new Date(),
      },
    );
  }

  public async getLLMModel(teamId: string, id: string) {
    return await this.llmModelRepository.findOne({
      where: {
        teamId,
        id,
        isDeleted: false,
      },
    });
  }

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelAssetRepositroy.listAssets('llm-model', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async createLLMModel(teamId: string, creatorUserId: string, channelType: number, channelId: number, models: LlmOneapiModel, icon?: string, displayName?: string, description?: string) {
    const oneapiChannel = ONEAPI_CHANNELS.find((channel) => channel.id === channelType.toString());

    if (!oneapiChannel) {
      throw new Error('Invalid LLM Model type');
    }

    const finalDisplayName = displayName?.toString() || oneapiChannel.displayName;
    const finalDescription = description ? `${description?.toString()} | ` : '';

    const entity: Partial<LlmModelEntity> = {
      id: generateDbId(),
      teamId,
      creatorUserId,
      isDeleted: false,
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      iconUrl: icon || oneapiChannel.iconUrl,
      displayName: finalDisplayName,
      description: {
        'zh-CN': `${finalDescription}由 ${typeof finalDisplayName === 'object' ? Object.values(finalDisplayName)[0] : finalDisplayName} 提供，支持 ${Object.values(models).join(', ')} 模型`,
        'en-US': `${finalDescription}Provided by ${finalDisplayName}, support ${Object.values(models).join(', ')} models`,
      },
      channelType,
      channelId,
      models,
    };
    await this.llmModelRepository.save(entity);
    return entity;
  }

  public async getLLMModelByChannelType(teamId: string, channelType: number) {
    return await this.llmModelRepository.findOne({
      where: {
        teamId,
        channelType,
        isDeleted: false,
      },
    });
  }

  public async getLLMModelByChannelId(channelId: number) {
    return await this.llmModelRepository.findOne({
      where: {
        channelId,
        isDeleted: false,
      },
    });
  }

  public async updateLLMModel(id: string, dto: UpdateLlmModelParams) {
    return await this.llmModelRepository.update(id, {
      ...dto,
      updatedTimestamp: +new Date(),
    });
  }
}
