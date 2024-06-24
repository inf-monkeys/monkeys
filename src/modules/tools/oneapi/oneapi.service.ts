import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { OneApiClient, OneApiSystemApiClient, generateOneApiTokenByUsernamePassword } from '@/common/oneapi';
import { generatePassword, generateShortId } from '@/common/utils';
import { OneApiRepository } from '@/database/repositories/oneapi.respository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OneAPIService {
  constructor(private readonly oneapiRepository: OneApiRepository) {}

  private getSystemClient() {
    const { enabled, baseURL, rootToken } = config.oneapi;
    if (!enabled) {
      throw new Error('OneAPI Service is not enabled');
    }
    return new OneApiSystemApiClient(baseURL, rootToken);
  }

  private async getOrCreateOneapiUser(teamId: string) {
    const oneapiUser = await this.oneapiRepository.getOneapiUserByTeamId(teamId);
    if (oneapiUser) {
      return oneapiUser;
    }
    const password = generatePassword();
    const username = generateShortId();
    const systemClient = this.getSystemClient();
    logger.info(`Creating OneAPI user: ${username}`);
    const newUser = await systemClient.addUserIfNotExists(username, password, username);
    const oneAPIUserToken = await generateOneApiTokenByUsernamePassword(config.oneapi.baseURL, username, password);
    const userClient = new OneApiClient(config.oneapi.baseURL, oneAPIUserToken);
    const apikey = await userClient.getApiKey();
    return await this.oneapiRepository.createOneapiUser(teamId, newUser.id, oneAPIUserToken, apikey, username, password);
  }

  public async createOneAPIChannel(teamId: string, userId: string, channelId: number, data: { [x: string]: any }) {
    const oneapiUser = await this.getOrCreateOneapiUser(teamId);
    const systemClient = this.getSystemClient();
    const modelsCreated = await systemClient.createChannel(channelId, teamId, data);
    const userClient = new OneApiClient(config.oneapi.baseURL, oneapiUser.userToken);
    await userClient.updateTokenModelScope(modelsCreated);
    return modelsCreated;
  }
}
