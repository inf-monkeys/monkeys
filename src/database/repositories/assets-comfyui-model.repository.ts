import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComfyuiModelEntity } from '../entities/assets/model/comfyui-model/comfyui-model.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class ComfyuiModelAssetRepositroy extends AbstractAssetRepository<ComfyuiModelEntity> {
  constructor(
    @InjectRepository(ComfyuiModelEntity)
    public readonly assetRepository: Repository<ComfyuiModelEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
