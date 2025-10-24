import { ExportedGlobalWorkflowAssociationEntity, GlobalWorkflowAssociationsEntity } from '@/database/entities/workflow/global-workflow-association';
import { ExportedWorkflowAssociationEntity, WorkflowAssociationsEntity } from '@/database/entities/workflow/workflow-association';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import _, { isArray } from 'lodash';
import { MarketplaceService } from '../marketplace/services/marketplace.service';
import { AssetCloneResult, AssetUpdateResult, IAssetHandler, IStagedAssets } from '../marketplace/types';
import { WorkflowAssociationService } from './workflow.association.service';
import { WorkflowCrudService } from './workflow.curd.service';

export type ImportedAllWorkflowAssociationEntity = WorkflowAssociationsEntity | GlobalWorkflowAssociationsEntity;
export type ExportedAllWorkflowAssociationEntity = ExportedWorkflowAssociationEntity | ExportedGlobalWorkflowAssociationEntity;

@Injectable()
export class WorkflowAssociationCrudService implements IAssetHandler {
  constructor(
    private readonly workflowCrudService: WorkflowCrudService,
    private readonly workflowAssociationService: WorkflowAssociationService,

    @Inject(forwardRef(() => MarketplaceService))
    private readonly marketplaceService: MarketplaceService,
  ) {}

  public async processSnapshot(snapshot: ExportedAllWorkflowAssociationEntity, teamId: string): Promise<ImportedAllWorkflowAssociationEntity> {
    const associationData = _.pick(snapshot, ['displayName', 'description', 'enabled', 'mapper', 'iconUrl', 'sortIndex', 'type', 'extraData']);

    // 处理 originWorkflowId
    if (snapshot.scope === 'specific' && snapshot.originWorkflowId) {
      // 1. 通过 app id 找到所有版本
      const app = await this.marketplaceService.getAppDetails(snapshot.originWorkflowId);

      if (app) {
        // 2. 获取最新版本
        const latestVersion = app.versions.sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];

        // 3. 查找团队内安装的这个版本的应用
        const installedApp = await this.marketplaceService.getInstalledAppByAppVersionId(latestVersion.id, teamId);

        // 4. 获取实际的工作流 ID
        if (installedApp?.installedAssetIds?.workflow?.[0]) {
          associationData['originWorkflowId'] = installedApp.installedAssetIds.workflow[0];
        } else {
          throw new NotFoundException(`工作流 ${snapshot.originWorkflowId} 未安装`);
        }
      } else {
        throw new NotFoundException(`工作流 ${snapshot.originWorkflowId} 未安装`);
      }
    }

    // 处理 targetWorkflowId (如果是 to-workflow 类型)
    if (snapshot.type === 'to-workflow' && snapshot.targetWorkflowId) {
      const app = await this.marketplaceService.getAppDetails(snapshot.targetWorkflowId);

      if (app) {
        const latestVersion = app.versions.sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];

        const installedApp = await this.marketplaceService.getInstalledAppByAppVersionId(latestVersion.id, teamId);

        if (installedApp?.installedAssetIds?.workflow?.[0]) {
          associationData['targetWorkflowId'] = installedApp.installedAssetIds.workflow[0];
        } else {
          throw new NotFoundException(`工作流 ${snapshot.targetWorkflowId} 未安装`);
        }
      } else {
        throw new NotFoundException(`工作流 ${snapshot.targetWorkflowId} 未安装`);
      }
    }

    return { ...snapshot, ...associationData };
  }
  /**
   * 获取工作流关联的快照
   */
  public async getSnapshot(workflowAssociationId: string, _version: number, externalAssetList?: IStagedAssets): Promise<any> {
    const association = await this.workflowAssociationService.getWorkflowAssociation(workflowAssociationId, false);

    if (!association) {
      throw new NotFoundException('关联不存在');
    }

    const { targetWorkflowId: originTargetWorkflowId, type, scope } = association;

    let originWorkflowId: string | undefined;
    let targetWorkflowId: string | undefined;

    if (scope === 'specific') {
      const { originWorkflowId: originOriginWorkflowId } = association as WorkflowAssociationsEntity;

      // 获取目标工作流和源工作流的信息
      const originWorkflow = await this.workflowCrudService.getWorkflowDefByRecordId(originOriginWorkflowId);
      const targetWorkflow = type === 'to-workflow' ? await this.workflowCrudService.getWorkflowDefByRecordId(originTargetWorkflowId) : undefined;

      if ((!targetWorkflow && type === 'to-workflow') || !originWorkflow) {
        throw new NotFoundException('目标工作流或源工作流不存在');
      }

      // 如果有指定的资产列表，先从资产列表检查
      if (isArray(externalAssetList) && externalAssetList.length > 0) {
        const originWorkflowAsset = externalAssetList.find((asset) => asset.type === 'workflow' && asset.id === originOriginWorkflowId);
        if (originWorkflowAsset) {
          originWorkflowId = originWorkflowAsset.appId;
        } else {
          throw new Error(`工作流 ${originOriginWorkflowId} 不存在于资产列表中`);
        }

        if (type === 'to-workflow') {
          const targetWorkflowAsset = externalAssetList.find((asset) => asset.type === 'workflow' && asset.id === originTargetWorkflowId);
          if (targetWorkflowAsset) {
            targetWorkflowId = targetWorkflowAsset.appId;
          } else {
            throw new Error(`工作流 ${targetWorkflowId} 不存在于资产列表中`);
          }
        }
      } else {
        // 检查 forkFromId
        if (originWorkflow?.forkFromId) {
          // 获取应用市场版本信息
          const appVersion = await this.marketplaceService.getAppVersionById(originWorkflow.forkFromId);
          if (!appVersion) {
            throw new Error(`找不到工作流 ${originOriginWorkflowId} 对应的应用市场应用`);
          }
          originWorkflowId = appVersion.appId;
        } else {
          throw new Error(`工作流 ${originOriginWorkflowId} 没有发布到市场`);
        }

        if (type === 'to-workflow') {
          const tagetWorkflowAppVersionId = await this.marketplaceService.getAppVersionById(targetWorkflow.forkFromId);
          if (tagetWorkflowAppVersionId) {
            targetWorkflowId = tagetWorkflowAppVersionId.appId;
          } else {
            throw new Error(`找不到工作流 ${originTargetWorkflowId} 对应的应用市场应用`);
          }
        }
      }
    } else {
      // 获取目标工作流的信息
      const targetWorkflow = type === 'to-workflow' ? await this.workflowCrudService.getWorkflowDefByRecordId(originTargetWorkflowId) : undefined;

      if (!targetWorkflow && type === 'to-workflow') {
        throw new NotFoundException('目标工作流不存在');
      }

      // 如果有指定的资产列表，先从资产列表检查
      if (isArray(externalAssetList) && externalAssetList.length > 0) {
        if (type === 'to-workflow') {
          const targetWorkflowAsset = externalAssetList.find((asset) => asset.type === 'workflow' && asset.id === originTargetWorkflowId);
          if (targetWorkflowAsset) {
            targetWorkflowId = targetWorkflowAsset.appId;
          } else {
            throw new Error(`工作流 ${targetWorkflowId} 不存在于资产列表中`);
          }
        }
      } else {
        if (type === 'to-workflow') {
          const tagetWorkflowAppVersionId = await this.marketplaceService.getAppVersionById(targetWorkflow.forkFromId);
          if (tagetWorkflowAppVersionId) {
            targetWorkflowId = tagetWorkflowAppVersionId.appId;
          } else {
            throw new Error(`找不到工作流 ${originTargetWorkflowId} 对应的应用市场应用`);
          }
        }
      }
    }

    return {
      ...association,
      targetWorkflowId: type === 'to-workflow' ? targetWorkflowId : undefined,
      originWorkflowId,
    };
  }

  /**
   * 从快照中克隆工作流关联
   * 需要将市场中的 app id 映射为团队内的实际工作流 id
   */
  public async cloneFromSnapshot(snapshot: ExportedAllWorkflowAssociationEntity, teamId: string): Promise<AssetCloneResult> {
    const processedSnapshot = await this.processSnapshot(snapshot, teamId);

    const newAssociation = await this.workflowAssociationService.createWorkflowAssociation(snapshot.scope === 'global' ? 'global' : processedSnapshot['originWorkflowId'], teamId, processedSnapshot);

    // 返回第一个关联的ID作为主要ID
    return {
      originalId: snapshot.id,
      newId: newAssociation.id,
    };
  }

  public async updateFromSnapshot(snapshot: ExportedAllWorkflowAssociationEntity, teamId: string, userId: string, assetId: string): Promise<AssetUpdateResult> {
    const processedSnapshot = await this.processSnapshot(snapshot, teamId);
    await this.workflowAssociationService.updateWorkflowAssociation(assetId, snapshot.scope, teamId, processedSnapshot);
    return { originalId: assetId };
  }

  /**
   * 重新映射工作流关联的依赖关系
   */
  public async remapDependencies(associationId: string, idMapping: { [originalId: string]: string }): Promise<void> {
    const association = await this.workflowAssociationService.getWorkflowAssociation(associationId);
    if (!association) {
      throw new NotFoundException('关联不存在');
    }

    let needsUpdate = false;
    const updates = _.pick(association, ['displayName', 'description', 'enabled', 'mapper', 'iconUrl', 'sortIndex', 'type', 'extraData']);

    // 1. 处理 originWorkflowId
    if (association.scope === 'specific' && association.originWorkflowId && idMapping[association.originWorkflowId]) {
      updates['originWorkflowId'] = idMapping[association.originWorkflowId];
      needsUpdate = true;
    }

    // 2. 处理 targetWorkflowId (如果是 to-workflow 类型)
    if (association.type === 'to-workflow' && association.targetWorkflowId && idMapping[association.targetWorkflowId]) {
      updates['targetWorkflowId'] = idMapping[association.targetWorkflowId];
      needsUpdate = true;
    }

    // 如果有更新，保存更改
    if (needsUpdate) {
      await this.workflowAssociationService.updateWorkflowAssociation(association.id, association.scope, association.targetWorkflow.teamId, updates);
    }
  }

  public async getById(assetId: string, _teamId: string): Promise<any> {
    return await this.workflowAssociationService.getWorkflowAssociation(assetId, false);
  }
}
