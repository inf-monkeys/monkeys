import { ListDto } from '@/common/dto/list.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmModelEntity } from '../entities/assets/model/llm-model/llm-model';
import { LlmModelAssetRepositroy } from './assets-llm-model.respository';

@Injectable()
export class LlmModelRepository {
  constructor(
    @InjectRepository(LlmModelEntity)
    private readonly llmModelRepository: Repository<LlmModelEntity>,
    private readonly llmModelAssetRepositroy: LlmModelAssetRepositroy,
  ) {}

  public async listLlmModels(teamId: string, dto: ListDto) {
    return await this.llmModelAssetRepositroy.listAssets('llm-model', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }
}
