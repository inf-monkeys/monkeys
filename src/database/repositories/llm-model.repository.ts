import { ListDto } from '@/common/dto/list.dto';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmModelEntity, LlmOneapiModel } from '../entities/assets/model/llm-model/llm-model';
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

  public async createLLMModel(teamId: string, creatorUserId: string, channelType: number, channelId: number, models: LlmOneapiModel) {
    const oneapiChannel = ONEAPI_CHANNELS.find((channel) => channel.id === channelType.toString());

    if (!oneapiChannel) {
      throw new Error('Invalid LLM Model type');
    }
    const entity: Partial<LlmModelEntity> = {
      id: generateDbId(),
      teamId,
      creatorUserId,
      isDeleted: false,
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      iconUrl: oneapiChannel.iconUrl,
      displayName: oneapiChannel.displayName,
      description: oneapiChannel.description,
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
}
