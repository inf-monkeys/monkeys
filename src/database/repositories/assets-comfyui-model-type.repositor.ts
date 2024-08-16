import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComfyuiModelTypeEntity } from '../entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class ComfyuiModelTypeAssetRepositroy extends AbstractAssetRepository<ComfyuiModelTypeEntity> {
  constructor(
    @InjectRepository(ComfyuiModelTypeEntity)
    public readonly assetRepository: Repository<ComfyuiModelTypeEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
