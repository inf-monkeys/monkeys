import { getComfyuiWorkflowDataListFromWorkflow } from '@/common/utils';
import { AssetPublishConfig, BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { SimpleTaskDef } from '@inf-monkeys/conductor-javascript';
import { AssetType, MonkeyWorkflowDef } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { AssetsMapperService } from './assets.common.service';

@Injectable()
export class AssetsPublishService {
  constructor(private readonly assetsMapperService: AssetsMapperService) {}

  public async publishAsset(teamId: string, assetType: AssetType, assetId: string, publishConfig: AssetPublishConfig) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    const asset = await repo.getAssetById(assetId);
    if (asset.assetType === 'workflow') {
      const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow(asset as unknown as MonkeyWorkflowDef);
      if (comfyuiDataList.length > 0) {
        const comfyuiWorkflowRepo = this.assetsMapperService.getRepositoryByAssetType('comfyui-workflow');
        for (const [, { index, comfyuiWorkflowId }] of comfyuiDataList.entries()) {
          const { id } = await comfyuiWorkflowRepo.publishAsset(teamId, comfyuiWorkflowId, publishConfig);
          ((asset as unknown as MonkeyWorkflowDef).tasks[index] as SimpleTaskDef).inputParameters.workflow = id;
        }
        return await repo.publishAsset(teamId, assetId, publishConfig, asset);
      }
    }
    return await repo.publishAsset(teamId, assetId, publishConfig);
  }

  public async forkAsset(assetType: AssetType, teamId: string, assetId: string) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    return await repo.forkAsset(teamId, assetId);
  }

  public async updatePublishedAsset(assetType: AssetType, teamId: string, assetId: string, newAssetData: BaseAssetEntity) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    return await repo.updatePublishedAsset(teamId, assetId, newAssetData);
  }

  public async deletePublishedAsset(assetType: AssetType, teamId: string, assetId: string) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    const asset = await repo.getAssetById(assetId, { isPublished: true });
    if (asset.assetType === 'workflow') {
      const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow(asset as unknown as MonkeyWorkflowDef);
      if (comfyuiDataList.length > 0) {
        const comfyuiWorkflowRepo = this.assetsMapperService.getRepositoryByAssetType('comfyui-workflow');
        for (const [, { comfyuiWorkflowId }] of comfyuiDataList.entries()) {
          try {
            await comfyuiWorkflowRepo.deletePublishedAsset(teamId, comfyuiWorkflowId, true);
          } catch (error) {}
        }
        return await repo.deletePublishedAsset(teamId, assetId, true);
      }
    }
    return await repo.deletePublishedAsset(teamId, assetId);
  }
}
