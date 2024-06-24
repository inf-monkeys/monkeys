import { config } from '@/common/config';
import { OneApiClient, OneApiSystemApiClient } from '@/common/oneapi';
import { generatePassword } from '@/common/utils';
import { TeamRepository } from '@/database/repositories/team.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OneAPIService {
  constructor(private readonly teamRepository: TeamRepository) {}

  private getSystemClient() {
    const { enabled, baseURL, rootToken } = config.oneapi;
    if (!enabled) {
      throw new Error('OneAPI Service is not enabled');
    }
    return new OneApiSystemApiClient(baseURL, rootToken);
  }

  private async getOneAPIToken(teamId: string) {
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    let { oneAPIToken } = team;
    if (!oneAPIToken) {
      const password = generatePassword();
      const systemClient = this.getSystemClient();
      const oneapiUser = await systemClient.addUserIfNotExists(teamId, password, teamId);
      oneAPIToken = oneapiUser.access_token;
      await this.teamRepository.updateTeam(teamId, {
        oneAPIToken,
        oneAPIPassword: password,
      });
    }
    return oneAPIToken;
  }

  public async createOneAPIChannel(teamId: string, userId: string, channelId: number, data: { [x: string]: any }) {
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    const oneAPIToken = await this.getOneAPIToken(teamId);
    const apiClient = new OneApiClient(config.oneapi.baseURL, oneAPIToken);
    const { success, message } = await apiClient.createChannel(channelId, data);
  }
}
