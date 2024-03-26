import { AssetType } from '@/common/typings/asset';
import { AssetPublishConfig } from '@/database/entities/assets/base-asset';
import { CanvasAssetRepositroy } from '@/database/repositories/assets-canvas.repository';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { LlmModelAssetRepositroy } from '@/database/repositories/assets-llm-model.respository';
import { MediaFileAssetRepositroy } from '@/database/repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from '@/database/repositories/assets-sd-model.repository';
import { TableCollectionAssetRepositroy } from '@/database/repositories/assets-table-collection.repository';
import { TextCollectionAssetRepositroy } from '@/database/repositories/assets-text-collections.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsPublishService {
  constructor(
    private readonly assetsCommonRepository: AssetsCommonRepository,
    private readonly canvasAssetsRepository: CanvasAssetRepositroy,
    private readonly llmModelAssetsRepository: LlmModelAssetRepositroy,
    private readonly sdModelAssetsRepository: SdModelAssetRepositroy,
    private readonly textCollectionAssetsRepository: TextCollectionAssetRepositroy,
    private readonly mediaFileAssetsRepository: MediaFileAssetRepositroy,
    private readonly tableCollectionAssetsRepository: TableCollectionAssetRepositroy,
  ) {}

  public async publicAsset(teamId: string, assetType: AssetType, assetId: string, publishConfig: AssetPublishConfig) {
    if (assetType === 'canvas') {
      return this.canvasAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
    if (assetType === 'llm-model') {
      return this.llmModelAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
    if (assetType === 'sd-model') {
      return this.sdModelAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
    if (assetType === 'text-collection') {
      return await this.textCollectionAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
    if (assetType === 'media-file') {
      return this.mediaFileAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
    if (assetType === 'table-collection') {
      return await this.tableCollectionAssetsRepository.publishAsset(teamId, assetId, publishConfig);
    }
  }

  public async forkAsset(assetType: AssetType, teamId: string, assetId: string) {
    if (assetType === 'canvas') {
      return this.canvasAssetsRepository.forkAsset(teamId, assetId);
    }
    if (assetType === 'llm-model') {
      return this.llmModelAssetsRepository.forkAsset(teamId, assetId);
    }
    if (assetType === 'sd-model') {
      return this.sdModelAssetsRepository.forkAsset(teamId, assetId);
    }
    if (assetType === 'text-collection') {
      return this.textCollectionAssetsRepository.forkAsset(teamId, assetId);
    }
    if (assetType === 'media-file') {
      return this.mediaFileAssetsRepository.forkAsset(teamId, assetId);
    }
    if (assetType === 'table-collection') {
      return this.tableCollectionAssetsRepository.forkAsset(teamId, assetId);
    }
  }
}
