import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { OneApiSystemApiClient } from '@/common/oneapi';
import { UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { Injectable } from '@nestjs/common';

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

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelRepository.listLlmModels(teamId, dto);
  }

  public async deleteLLMModel(teamId: string, id: string) {
    const model = await this.getLLMModel(teamId, id);
    const channelId = model.channelId;

    const client = await this.getSystemClient();
    await client.deleteChannel(channelId);

    return await this.llmModelRepository.deleteLLMModel(teamId, id);
  }

  public async getLLMModel(teamId: string, id: string) {
    return await this.llmModelRepository.getLLMModel(teamId, id);
  }

  public async updateLLMModel(teamId: string, id: string, dto: UpdateLlmModelParams) {
    return await this.llmModelRepository.updateLLMModel(teamId, id, dto);
  }
}
