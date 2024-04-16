import { ListDto } from '@/common/dto/list.dto';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmModelService {
  constructor(private readonly llmModelRepository: LlmModelRepository) {}

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelRepository.listLlmModels(teamId, dto);
  }
}
