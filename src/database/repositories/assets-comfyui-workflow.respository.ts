import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComfyuiWorkflowEntity } from '../entities/comfyui/comfyui-workflow.entity';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class ComfyuiWorkflowAssetRepositroy extends AbstractAssetRepository<ComfyuiWorkflowEntity> {
  constructor(
    @InjectRepository(ComfyuiWorkflowEntity)
    public readonly assetRepository: Repository<ComfyuiWorkflowEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
