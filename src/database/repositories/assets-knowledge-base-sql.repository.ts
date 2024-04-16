import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqlKnowLedgeBaseEntity } from '../entities/assets/knowledge-base/knowledge-base-sql.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class SqlKnowledgeBaseAssetRepositroy extends AbstractAssetRepository<SqlKnowLedgeBaseEntity> {
  constructor(
    @InjectRepository(SqlKnowLedgeBaseEntity)
    public readonly assetRepository: Repository<SqlKnowLedgeBaseEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
