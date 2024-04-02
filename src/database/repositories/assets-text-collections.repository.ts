import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextCollectionEntity } from '../entities/assets/collection/text-collection/text-collection';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class TextCollectionAssetRepositroy extends AbstractAssetRepository<TextCollectionEntity> {
  constructor(
    @InjectRepository(TextCollectionEntity)
    public readonly assetRepository: Repository<TextCollectionEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
