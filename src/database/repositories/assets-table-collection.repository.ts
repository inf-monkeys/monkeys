import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableCollectionEntity } from '../entities/assets/collection/table-collection/table-collection';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class TableCollectionAssetRepositroy extends AbstractAssetRepository<TableCollectionEntity> {
  constructor(
    @InjectRepository(TableCollectionEntity)
    public readonly assetRepository: Repository<TableCollectionEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}