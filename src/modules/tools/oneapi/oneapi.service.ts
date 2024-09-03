import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { OneApiClient, OneApiSystemApiClient, generateOneApiTokenByUsernamePassword } from '@/common/oneapi';
import { CHANNEL_OPTIONS } from '@/common/oneapi/consts';
import { generatePassword, generateShortId } from '@/common/utils';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { OneApiRepository } from '@/database/repositories/oneapi.respository';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OneAPIService {
  constructor(
    private readonly oneapiRepository: OneApiRepository,
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

  private async getOrCreateOneapiUser(teamId: string) {
    const oneapiUser = await this.oneapiRepository.getOneapiUserByTeamId(teamId);
    if (oneapiUser) {
      return oneapiUser;
    }
    const password = generatePassword();
    const username = generateShortId();
    const systemClient = await this.getSystemClient();
    logger.info(`Creating OneAPI user: ${username}`);
    const newUser = await systemClient.addUserIfNotExists(username, password, username);
    const oneAPIUserToken = await generateOneApiTokenByUsernamePassword(config.oneapi.baseURL, username, password);
    const userClient = new OneApiClient(config.oneapi.baseURL, oneAPIUserToken);
    const apikey = await userClient.getApiKey();
    return await this.oneapiRepository.createOneapiUser(teamId, newUser.id, oneAPIUserToken, apikey, username, password);
  }

  public async createOneAPIChannel(teamId: string, userId: string, channelType: number, data: { [x: string]: any }) {
    const existsModel = await this.llmModelRepository.getLLMModelByChannelType(teamId, channelType);
    if (existsModel) {
      throw new Error('One team can only have one LLM channel of the same type');
    }

    const { icon, displayName, description, ...rest } = data;

    const oneapiUser = await this.getOrCreateOneapiUser(teamId);
    const systemClient = await this.getSystemClient();
    const channel = await systemClient.createChannel(channelType, teamId, rest);
    const userClient = new OneApiClient(config.oneapi.baseURL, oneapiUser.userToken);
    await userClient.updateTokenModelScope(channel.models.split(','));
    await this.llmModelRepository.createLLMModel(teamId, userId, channelType, channel.id, JSON.parse(channel.model_mapping), icon, displayName, description);
    return channel;
  }

  public async getModels() {
    const systemClient = await this.getSystemClient();
    const systemModels = await systemClient.loadModels();

    return Object.values(CHANNEL_OPTIONS)
      .map((channel) => ({
        ...channel,
        models: systemModels[channel.value] || [],
      }))
      .filter((channel) => channel.models.length > 0);
  }

  public async testChannel(teamId: string, channelId: number, modelId: string) {
    const oneapiUser = await this.getOrCreateOneapiUser(teamId);
    const systemClient = await this.getSystemClient();
    return await systemClient.testChannel(channelId, modelId);
  }
}
