import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmModelEntity } from '../entities/assets/model/llm-model/llm-model';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class LlmModelAssetRepositroy extends AbstractAssetRepository<LlmModelEntity> {
  constructor(
    @InjectRepository(LlmModelEntity)
    public readonly assetRepository: Repository<LlmModelEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
