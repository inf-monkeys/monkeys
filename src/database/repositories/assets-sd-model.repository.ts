import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdModelEntity } from '../entities/assets/model/sd-model/sd-model';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class SdModelAssetRepositroy extends AbstractAssetRepository<SdModelEntity> {
  constructor(
    @InjectRepository(SdModelEntity)
    public readonly assetRepository: Repository<SdModelEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
