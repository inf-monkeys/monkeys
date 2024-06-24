import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmChannelEntity } from '../entities/assets/model/llm-channel/llm-channel.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class LlmChannelAssetRepositroy extends AbstractAssetRepository<LlmChannelEntity> {
  constructor(
    @InjectRepository(LlmChannelEntity)
    public readonly assetRepository: Repository<LlmChannelEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
