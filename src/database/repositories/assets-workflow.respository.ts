import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowMetadataEntity } from '../entities/workflow/workflow-metadata';
import { AbstractAssetRepository } from './assets-abstract.repository';
import { AssetsCommonRepository } from './assets-common.repository';

@Injectable()
export class WorkflowAssetRepositroy extends AbstractAssetRepository<WorkflowMetadataEntity> {
  constructor(
    @InjectRepository(WorkflowMetadataEntity)
    public readonly assetRepository: Repository<WorkflowMetadataEntity>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {
    super(assetRepository, assetCommonRepository);
  }
}
