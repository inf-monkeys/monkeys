import { DesignAssociationEntity } from '@/database/entities/design/design-association';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceService } from '../marketplace/services/marketplace.service';
import { AssetCloneResult, AssetUpdateResult, IAssetHandler } from '../marketplace/types';
import { WorkflowCrudService } from '../workflow/workflow.curd.service';
import { DesignAssociationService } from './design.association.service';

@Injectable()
export class DesignAssociationCrudService implements IAssetHandler {
  constructor(
    private readonly designAssociationService: DesignAssociationService,

    @Inject(forwardRef(() => WorkflowCrudService))
    private readonly workflowCrudService: WorkflowCrudService,

    @Inject(forwardRef(() => MarketplaceService))
    private readonly marketplaceService: MarketplaceService,
  ) {}

  async processSnapshot(snapshot: DesignAssociationEntity, teamId: string): Promise<DesignAssociationEntity> {
    const association = await this.designAssociationService.findById(snapshot.id);
    if (!association) {
      throw new NotFoundException('关联不存在');
    }

    if (snapshot.targetWorkflowId) {
      // 1. 通过 app id 找到所有版本
      const app = await this.marketplaceService.getAppDetails(snapshot.targetWorkflowId);

      if (app) {
        // 2. 获取最新版本
        const latestVersion = app.versions.sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0];

        // 3. 查找团队内安装的这个版本的应用
        const installedApp = await this.marketplaceService.getInstalledAppByAppVersionId(latestVersion.id, teamId);

        // 4. 获取实际的工作流 ID
        if (installedApp?.installedAssetIds?.workflow?.[0]) {
          snapshot['targetWorkflowId'] = installedApp.installedAssetIds.workflow[0];
        }
      }
    }

    return snapshot;
  }

  /**
   * 获取设计关联的快照
   */
  public async getSnapshot(designAssociationId: string): Promise<any> {
    const association = await this.designAssociationService.findById(designAssociationId);

    if (!association) {
      throw new NotFoundException('关联不存在');
    }

    const { targetWorkflowId } = association;

    // 获取目标工作流的信息
    const targetWorkflow = await this.workflowCrudService.getWorkflowDef(targetWorkflowId);

    if (!targetWorkflow) {
      throw new NotFoundException('目标工作流不存在');
    }

    // 检查 forkFromId
    if (!targetWorkflow?.forkFromId) {
      throw new Error(`工作流 ${targetWorkflowId} 没有发布到市场`);
    }

    // 获取应用市场版本信息
    const appVersion = await this.marketplaceService.getAppVersionById(targetWorkflow.forkFromId);
    if (!appVersion) {
      throw new Error(`找不到工作流 ${targetWorkflowId} 对应的应用市场应用`);
    }

    return {
      ...association,
      teamId: undefined,
      targetWorkflowId: appVersion.appId,
    };
  }

  /**
   * 从快照中克隆设计关联
   * 需要将市场中的 app id 映射为团队内的实际设计 id
   */
  public async cloneFromSnapshot(snapshot: DesignAssociationEntity, teamId: string): Promise<AssetCloneResult> {
    const processedSnapshot = await this.processSnapshot(snapshot, teamId);

    const newAssociation = await this.designAssociationService.create({ ...processedSnapshot, teamId });

    // 返回第一个关联的ID作为主要ID
    return {
      originalId: snapshot.id,
      newId: newAssociation.id,
    };
  }

  public async updateFromSnapshot(snapshot: DesignAssociationEntity, teamId: string, userId: string, assetId: string): Promise<AssetUpdateResult> {
    const processedSnapshot = await this.processSnapshot(snapshot, teamId);

    await this.designAssociationService.update(assetId, { ...processedSnapshot, teamId });

    return {
      originalId: assetId,
    };
  }

  /**
   * 重新映射设计关联的依赖关系
   */
  public async remapDependencies(associationId: string, idMapping: { [originalId: string]: string }): Promise<void> {
    const association = await this.designAssociationService.findById(associationId);
    if (!association) {
      throw new NotFoundException('关联不存在');
    }

    let needsUpdate = false;

    // 1. 处理 targetWorkflowId
    if (association.targetWorkflowId && idMapping[association.targetWorkflowId]) {
      association['targetWorkflowId'] = idMapping[association.targetWorkflowId];
      needsUpdate = true;
    }

    // 如果有更新，保存更改
    if (needsUpdate) {
      await this.designAssociationService.update(association.id, association);
    }
  }
}
