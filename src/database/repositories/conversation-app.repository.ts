import { config, LlmModelEndpointType } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { ConversationStatusEnum } from '@/common/dto/status.enum';
import { generateDbId } from '@/common/utils';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { ConversationAppEntity, CreateConversationAppParams, UpdateConversationAppParams } from '../entities/conversation-app/conversation-app.entity';
import { ConversationExecutionEntity } from '../entities/conversation-app/conversation-executions.entity';
import { ConversationAppAssetRepositroy } from './assets-conversation-app.repository';
import { LlmModelRepository } from './llm-model.repository';
import { OneApiRepository } from './oneapi.respository';

@Injectable()
export class ConversationAppRepository {
  constructor(
    @InjectRepository(ConversationAppEntity)
    private readonly repository: Repository<ConversationAppEntity>,
    @InjectRepository(ConversationExecutionEntity)
    private readonly executionRepository: Repository<ConversationExecutionEntity>,
    private readonly assetRepository: ConversationAppAssetRepositroy,
    private readonly llmModelRepository: LlmModelRepository,
    private readonly oneapiRepository: OneApiRepository,
  ) {}

  public async listConversationApps(teamId: string, dto: ListDto) {
    return await this.assetRepository.listAssets('conversation-app', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  private async checkModel(model: string, teamId: string): Promise<'BUILT_IN' | 'ONEAPI'> {
    const avaliableModels = getModels(LlmModelEndpointType.CHAT_COMPLETIONS).map((x) => x.value);

    const [modelChannelId, modelName] = model.split(':');
    if (!isNaN(Number(modelChannelId))) {
      const llmModel = await this.llmModelRepository.getLLMModelByChannelId(Number(modelChannelId));
      if (!Object.values(llmModel?.models ?? {}).includes(modelName) || (llmModel?.isDeleted && llmModel?.teamId !== teamId)) {
        throw new Error('Model not found !');
      }

      return 'ONEAPI';
    }

    if (!avaliableModels.includes(model)) {
      throw new Error(`Model ${model} is not available`);
    }
    return 'BUILT_IN';
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

    await this.checkModel(model, teamId);

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
    if (updates.description != undefined) {
      entity.description = updates.description;
    }
    if (updates.iconUrl) {
      entity.iconUrl = updates.iconUrl;
    }
    if (updates.model) {
      await this.checkModel(updates.model, teamId);
      entity.model = updates.model;
    }
    if (updates.customModelName != undefined) {
      if (updates.customModelName !== entity.customModelName) {
        await this.checkCustomModelUnique(teamId, updates.customModelName);
      }
      entity.customModelName = updates.customModelName;
    }
    if (updates.systemPrompt != undefined) {
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

  private getDateList(startTimestamp: number, endTimestamp: number) {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);
    endDate.setDate(endDate.getDate() + 1);

    const dateList = [];
    const currentDate = startDate;

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      dateList.push(`${year}-${month}-${day}`);

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateList;
  }

  public async createConversationExecution(userId: string, appId: string, status: ConversationStatusEnum, takes: number) {
    await this.executionRepository.save({
      id: generateDbId(),
      createdTimestamp: +Date.now(),
      updatedTimestamp: +Date.now(),
      isDeleted: false,
      userId,
      status,
      takes,
      appId,
    });
  }

  public async getExecutionStatisticsByAppId(conversationAppId: string, startTimestamp: number, endTimestamp: number) {
    const appId = config.server.appId;
    const callsPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id = '${conversationAppId}' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
    `;

    const successPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id = '${conversationAppId}' AND status = 'SUCCEED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
`;

    const failedPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id = '${conversationAppId}' AND status = 'FAILED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
`;

    const averageTakesPerDateSql = `
SELECT
  app_id,
  TO_CHAR(TO_TIMESTAMP(created_timestamp / 1000), 'YYYY-MM-DD') AS date,
  AVG(takes) AS average_time
FROM
  ${appId}_conversation_executions
WHERE
  status = 'SUCCEED' AND app_id = '${conversationAppId}' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
  app_id,
  date
ORDER BY
  app_id,
  date;
    `;

    const dateList = this.getDateList(startTimestamp, endTimestamp);
    const [callsPerDayResult, successPerDayResult, failedPerDayResult, averageTakesPerDayResult] = await Promise.all([
      this.executionRepository.query(callsPerDateSql),
      this.executionRepository.query(successPerDateSql),
      this.executionRepository.query(failedPerDateSql),
      this.executionRepository.query(averageTakesPerDateSql),
    ]);

    const result: Array<{
      date: string;
      totalCount: number;
      successCount: number;
      failedCount: number;
      averageTime: number;
    }> = [];
    for (const date of dateList) {
      const callsPerDay = callsPerDayResult.find((x) => x.date === date);
      const successPerDay = successPerDayResult.find((x) => x.date === date);
      const failedPerDay = failedPerDayResult.find((x) => x.date === date);
      const averageTakesPerDay = averageTakesPerDayResult.find((x) => x.date === date);
      result.push({
        date,
        totalCount: parseInt(callsPerDay?.total_calls) || 0,
        successCount: parseInt(successPerDay?.total_calls) || 0,
        failedCount: parseInt(failedPerDay?.total_calls) || 0,
        averageTime: parseInt(averageTakesPerDay?.average_time) || 0,
      });
    }
    return result;
  }

  public async getExecutionStatisticsByTeamId(teamId: string, startTimestamp: number, endTimestamp: number) {
    const dateList = this.getDateList(startTimestamp, endTimestamp);

    const appId = config.server.appId;
    const appIds = _.uniq(
      (
        await this.repository.find({
          where: {
            teamId,
          },
          select: ['id'],
        })
      ).map((x) => x.id),
    );

    if (appIds.length === 0) {
      return dateList.map((date) => {
        return {
          date,
          totalCount: 0,
          successCount: 0,
          failedCount: 0,
          averageTime: 0,
        };
      });
    }

    const appIdsStr = appIds.map((x) => `'${x}'`).join(',');
    const callsPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id IN (${appIdsStr}) AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
    `;

    const successPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id IN (${appIdsStr}) AND status = 'SUCCEED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
`;

    const failedPerDateSql = `
SELECT
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/ 1000), 'YYYY-MM-DD') AS date,
    COUNT(*) AS total_calls
FROM
    ${appId}_conversation_executions
WHERE app_id IN (${appIdsStr}) AND status = 'FAILED' AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
    app_id,
    TO_CHAR(TO_TIMESTAMP(created_timestamp/1000), 'YYYY-MM-DD')
ORDER BY
    app_id,
    date;
`;

    const averageTakesPerDateSql = `
SELECT
  app_id,
  TO_CHAR(TO_TIMESTAMP(created_timestamp / 1000), 'YYYY-MM-DD') AS date,
  AVG(takes) AS average_time
FROM
  ${appId}_conversation_executions
WHERE
  status = 'SUCCEED' AND app_id IN (${appIdsStr}) AND created_timestamp >= ${startTimestamp} AND created_timestamp <= ${endTimestamp}
GROUP BY
  app_id,
  date
ORDER BY
  app_id,
  date;
    `;

    const [callsPerDayResult, successPerDayResult, failedPerDayResult, averageTakesPerDayResult] = await Promise.all([
      this.executionRepository.query(callsPerDateSql),
      this.executionRepository.query(successPerDateSql),
      this.executionRepository.query(failedPerDateSql),
      this.executionRepository.query(averageTakesPerDateSql),
    ]);

    const result: Array<{
      date: string;
      totalCount: number;
      successCount: number;
      failedCount: number;
      averageTime: number;
    }> = [];
    for (const date of dateList) {
      const callsPerDay = callsPerDayResult.find((x) => x.date === date);
      const successPerDay = successPerDayResult.find((x) => x.date === date);
      const failedPerDay = failedPerDayResult.find((x) => x.date === date);
      const averageTakesPerDay = averageTakesPerDayResult.find((x) => x.date === date);
      result.push({
        date,
        totalCount: parseInt(callsPerDay?.total_calls) || 0,
        successCount: parseInt(successPerDay?.total_calls) || 0,
        failedCount: parseInt(failedPerDay?.total_calls) || 0,
        averageTime: parseInt(averageTakesPerDay?.average_time) || 0,
      });
    }
    return result;
  }
}
