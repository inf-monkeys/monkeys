import { ConversationAppRepository } from '@/database/repositories/conversation-app.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationStatisticsService {
  constructor(private readonly conversationAppRepository: ConversationAppRepository) {}

  public async getExecutionStatisticsByAppId(appId: string, createdTimestampStr: string, endTimestampStr: string) {
    if (!createdTimestampStr || !endTimestampStr) {
      throw new Error('startTimestamp and endTimestamp are required');
    }
    const createdTimestamp = parseInt(createdTimestampStr, 10);
    const endTimestamp = parseInt(endTimestampStr, 10);
    if (isNaN(createdTimestamp) || isNaN(endTimestamp)) {
      throw new Error('startTimestamp and endTimestamp must be a number');
    }
    const data = await this.conversationAppRepository.getExecutionStatisticsByAppId(appId, createdTimestamp, endTimestamp);
    return data;
  }

  public async getExecutionStatisticsByTeamId(teamId: string, createdTimestampStr: string, endTimestampStr: string) {
    if (!createdTimestampStr || !endTimestampStr) {
      throw new Error('startTimestamp and endTimestamp are required');
    }
    const createdTimestamp = parseInt(createdTimestampStr, 10);
    const endTimestamp = parseInt(endTimestampStr, 10);
    if (isNaN(createdTimestamp) || isNaN(endTimestamp)) {
      throw new Error('startTimestamp and endTimestamp must be a number');
    }
    const data = await this.conversationAppRepository.getExecutionStatisticsByTeamId(teamId, createdTimestamp, endTimestamp);
    return data;
  }
}
