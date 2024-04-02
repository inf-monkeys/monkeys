import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AbstractAssetRepository } from '@/database/repositories/assets-abstract.repository';
import { CanvasAssetRepositroy } from '@/database/repositories/assets-canvas.repository';
import { LlmModelAssetRepositroy } from '@/database/repositories/assets-llm-model.respository';
import { MediaFileAssetRepositroy } from '@/database/repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from '@/database/repositories/assets-sd-model.repository';
import { TableCollectionAssetRepositroy } from '@/database/repositories/assets-table-collection.repository';
import { TextCollectionAssetRepositroy } from '@/database/repositories/assets-text-collections.repository';
import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsCommomService {
  constructor(
    private readonly canvasAssetsRepository: CanvasAssetRepositroy,
    private readonly llmModelAssetsRepository: LlmModelAssetRepositroy,
    private readonly sdModelAssetsRepository: SdModelAssetRepositroy,
    private readonly textCollectionAssetsRepository: TextCollectionAssetRepositroy,
    private readonly mediaFileAssetsRepository: MediaFileAssetRepositroy,
    private readonly tableCollectionAssetsRepository: TableCollectionAssetRepositroy,
    private readonly workflowAssetRepositroy: WorkflowAssetRepositroy,
  ) {}

  public getRepositoryByAssetType(assetType: AssetType): AbstractAssetRepository<BaseAssetEntity> {
    if (assetType === 'canvas') {
      return this.canvasAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'llm-model') {
      return this.llmModelAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'sd-model') {
      return this.sdModelAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'text-collection') {
      return this.textCollectionAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'media-file') {
      return this.mediaFileAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'table-collection') {
      return this.tableCollectionAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'workflow') {
      return this.workflowAssetRepositroy as AbstractAssetRepository<BaseAssetEntity>;
    } else {
      throw new Error('invalid assetType');
    }
  }
}
