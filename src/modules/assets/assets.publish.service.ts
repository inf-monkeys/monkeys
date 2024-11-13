import { getComfyuiWorkflowDataListFromWorkflow } from '@/common/utils';
import { AssetPublishConfig, BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AssetType, MonkeyWorkflowDef } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { AssetsMapperService } from './assets.common.service';

@Injectable()
export class AssetsPublishService {
  constructor(private readonly assetsMapperService: AssetsMapperService) {}

  public async publishAsset(teamId: string, assetType: AssetType, assetId: string, publishConfig: AssetPublishConfig) {
    const repo = this.assetsMapperService.getRepositoryByAssetType(assetType);
    const asset = await repo.getAssetById(assetId);
    if (!asset) throw new Error('资产未找到');
    if (asset.assetType === 'workflow') {
      const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow((asset as unknown as MonkeyWorkflowDef).tasks).map((c) => {
        return {
          path: `tasks${c.path}`,
          comfyuiWorkflowId: c.comfyuiWorkflowId,
        };
      });
      if (comfyuiDataList.length > 0) {
        const comfyuiWorkflowRepo = this.assetsMapperService.getRepositoryByAssetType('comfyui-workflow');

        const comfyuiWorkflowIds = Array.from(new Set(comfyuiDataList.map((c) => c.comfyuiWorkflowId)));
        const comfyuiWorkflowIdMapper = comfyuiWorkflowIds.reduce((mapper, comfyuiWorkflowId) => {
          mapper[comfyuiWorkflowId] = null;
          return mapper;
        }, {});
        for (const comfyuiWorkflowId of comfyuiWorkflowIds) {
          const { id } = await comfyuiWorkflowRepo.publishAsset(teamId, comfyuiWorkflowId, publishConfig);
          comfyuiWorkflowIdMapper[comfyuiWorkflowId] = id;
        }

        for (const [, { path, comfyuiWorkflowId }] of comfyuiDataList.entries()) {
          _.set(asset as unknown as MonkeyWorkflowDef, `${path}.server`, 'system');
          _.set(asset as unknown as MonkeyWorkflowDef, `${path}.workflow`, comfyuiWorkflowIdMapper[comfyuiWorkflowId]);
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
      const comfyuiDataList = getComfyuiWorkflowDataListFromWorkflow((asset as unknown as MonkeyWorkflowDef).tasks);
      if (comfyuiDataList.length > 0) {
        const comfyuiWorkflowIds = Array.from(new Set(comfyuiDataList.map((c) => c.comfyuiWorkflowId)));
        const comfyuiWorkflowRepo = this.assetsMapperService.getRepositoryByAssetType('comfyui-workflow');
        for (const comfyuiWorkflowId of comfyuiWorkflowIds) {
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
