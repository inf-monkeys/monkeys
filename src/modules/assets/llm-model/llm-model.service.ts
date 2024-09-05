import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { OneApiSystemApiClient } from '@/common/oneapi';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { LlmModelEntity, UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Injectable } from '@nestjs/common';
import { set } from 'lodash';

@Injectable()
export class LlmModelService {
  constructor(
    private readonly llmModelRepository: LlmModelRepository,
    private readonly systemConfigurationRepository: SystemConfigurationRepository,
  ) {}

  private async getSystemClient() {
    const { enabled, baseURL } = config.oneapi;
    if (!enabled) {
      throw new Error('OneAPI Service is not enabled');
    }
    const rootToken = await this.systemConfigurationRepository.getOneApiRootUserToken();
    return new OneApiSystemApiClient(baseURL, rootToken);
  }

  public async listLlmModels(teamId: string, dto?: ListDto) {
    let { list } = await this.llmModelRepository.listLlmModels(teamId, dto);

    const systemModels = getModels();

    if (systemModels.length) {
      const systemChannels = [] as LlmModelEntity[];

      for (const { name, value, icon, desc } of systemModels) {
        systemChannels.push({
          assetType: 'llm-model',
          channelId: 0,
          channelType: 1,
          displayName: name,
          description: desc || {
            'zh-CN': '系统内置大语言模型，由 OpenAI 标准接口提供',
            'en-US': 'The system has a built-in large language model, provided by the OpenAI standard interface',
          },
          iconUrl: icon || 'https://monkeyminio01.daocloud.cn/monkeys/icons/openai.webp',
          models: { [value]: value },
          id: `0-${value}`,
        } as LlmModelEntity);
      }

      list = [...list, ...systemChannels];
    }

    return list;
  }

  public async deleteLLMModel(teamId: string, id: string) {
    const model = await this.getLLMModel(teamId, id);
    const channelId = model.channelId;

    const client = await this.getSystemClient();
    await client.deleteChannel(channelId);

    return await this.llmModelRepository.deleteLLMModel(teamId, id);
  }

  public async getLLMModel(teamId: string, id: string) {
    const model = await this.llmModelRepository.getLLMModel(teamId, id);

    set(
      model,
      'metadata',
      ONEAPI_CHANNELS.find((channel) => channel.id === model.channelType.toString()),
    );

    return model;
  }

  public async updateLLMModel(teamId: string, id: string, dto: UpdateLlmModelParams) {
    return await this.llmModelRepository.updateLLMModel(teamId, id, dto);
  }
}
