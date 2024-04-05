import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class KnowledgeBaseAssetRepositroy extends AbstractAssetRepository<KnowLedgeBaseEntity> {
  constructor(
    @InjectRepository(KnowLedgeBaseEntity)
    public readonly assetRepository: Repository<KnowLedgeBaseEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
