import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { OneApiSystemApiClient } from '@/common/oneapi';
import { ONEAPI_CHANNELS } from '@/common/oneapi/consts';
import { LlmModelEntity, UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Injectable } from '@nestjs/common';
import { omit, set } from 'lodash';

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

    const client = await this.getSystemClient();
    const channelConfig = omit(await client.getChannel(model.channelId), [
      'id',
      'type',
      'key',
      'name',
      'group',
      'model_mapping',
      'config',
      'balance',
      'balance_updated_time',
      'response_time',
      'created_time',
      'test_time',
      'used_quota',
      'status',
      'weight',
      'priority',
    ]);
    if (typeof model.displayName === 'string') {
      set(channelConfig, 'displayName', model.displayName);
    }
    if (typeof model.description === 'string') {
      set(channelConfig, 'description', model.description);
    }

    const channelMetadata = ONEAPI_CHANNELS.find((channel) => channel.id === model.channelType.toString());

    for (const [key, value] of Object.entries(channelConfig)) {
      const property = channelMetadata.properites.find((it) => it.name === key);
      if (property) {
        if (key === 'models') {
          set(
            property,
            'default',
            value
              .toString()
              .split(',')
              .map((it) => it.replace(/^.*_/, '')),
          );
        } else {
          set(property, 'default', value);
        }
      }
    }

    const keyProperty = channelMetadata.properites.find((it) => it.name === 'key');
    if (keyProperty) {
      set(keyProperty, 'required', false);
    }

    set(model, 'metadata', channelMetadata);

    return model;
  }

  public async updateLLMModel(id: string, dto: UpdateLlmModelParams) {
    return await this.llmModelRepository.updateLLMModel(id, dto);
  }
}
