import { AssetType } from '@/common/typings/asset';
import { AssetPublishConfig } from '@/database/entities/assets/base-asset';
import { Injectable } from '@nestjs/common';
import { AssetsMapperService } from './assets.common.service';

@Injectable()
export class AssetsPublishService {
  constructor(private readonly assetsMapperService: AssetsMapperService) {}

  public async publishAsset(teamId: string, assetType: AssetType, assetId: string, publishConfig: AssetPublishConfig) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    return await repo.publishAsset(teamId, assetId, publishConfig);
  }

  public async forkAsset(assetType: AssetType, teamId: string, assetId: string) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    return await repo.forkAsset(teamId, assetId);
  }
}
