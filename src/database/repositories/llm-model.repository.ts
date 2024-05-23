import { ListDto } from '@/common/dto/list.dto';
import { Injectable } from '@nestjs/common';
import { LlmModelAssetRepositroy } from './assets-llm-model.respository';

@Injectable()
export class LlmModelRepository {
  constructor(private readonly llmModelAssetRepositroy: LlmModelAssetRepositroy) {}

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelAssetRepositroy.listAssets('llm-model', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }
}
