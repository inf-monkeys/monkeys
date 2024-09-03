import { ListDto } from '@/common/dto/list.dto';
import { UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmModelService {
  constructor(private readonly llmModelRepository: LlmModelRepository) {}

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelRepository.listLlmModels(teamId, dto);
  }

  public async deleteLLMModel(teamId: string, id: string) {
    return await this.llmModelRepository.deleteLLMModel(teamId, id);
  }

  public async getLLMModel(teamId: string, id: string) {
    return await this.llmModelRepository.getLLMModel(teamId, id);
  }

  public async updateLLMModel(teamId: string, id: string, dto: UpdateLlmModelParams) {
    return await this.llmModelRepository.updateLLMModel(teamId, id, dto);
  }
}
