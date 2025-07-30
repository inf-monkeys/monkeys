import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import {
  APP_ID_GROUP_STRATEGY,
  getAppSortIndex,
  getGroupKeyByAppId,
  getGroupNameByAppId,
  getGroupSortIndex
} from '@/modules/assets/assets.marketplace.data';
import { Injectable } from '@nestjs/common';
import { uniq } from 'lodash';
import { ComfyuiWorkflowEntity } from '../entities/comfyui/comfyui-workflow.entity';
import { ComfyuiWorkflowAssetRepositroy } from './assets-comfyui-workflow.respository';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';
import { WorkflowRepository } from './workflow.repository';

@Injectable()
export class AssetsMarketPlaceRepository {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowAssetRepository: WorkflowAssetRepositroy,
    private readonly comfyuiWorkflowAssetRepository: ComfyuiWorkflowAssetRepositroy,
  ) {}

  public async forkBuiltInWorkflowAssetsFromMarketPlace(
    teamId: string,
    creatorUserId: string,
    extraOptions?: {
      clonedComfyuiWorkflows: (ComfyuiWorkflowEntity & { forkFromId: string })[];
    },
  ) {
    const clonedWorkflows = await this.workflowAssetRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, creatorUserId);

    // 使用新的基于 appId 的分组策略
    const pageIdOrderMap = new Map<string, number>();
    const groupMap: Record<string, WorkflowPageGroupEntity> = {};

    // 为每个预置应用创建分组
    for (const workflow of clonedWorkflows) {
      const { forkFromId } = workflow;
      const groupKey = getGroupKeyByAppId(forkFromId, APP_ID_GROUP_STRATEGY);
      const groupName = getGroupNameByAppId(forkFromId, APP_ID_GROUP_STRATEGY);
      const appSortIndex = getAppSortIndex(forkFromId, APP_ID_GROUP_STRATEGY);
      const groupSortIndex = getGroupSortIndex(groupKey, APP_ID_GROUP_STRATEGY);

      // 获取或创建分组
      if (!groupMap[groupKey]) {
        const existingGroup = await this.workflowRepository.getPageGroupByName(teamId, groupName);
        if (existingGroup) {
          groupMap[groupKey] = existingGroup;
        } else {
          const newGroup = await this.workflowRepository.createPageGroup(teamId, groupName, undefined, undefined);
          groupMap[groupKey] = newGroup;
        }
        // 设置分组排序索引
        groupMap[groupKey].sortIndex = groupSortIndex;
      }

      // 获取工作流页面
      const pages = await this.workflowRepository.listWorkflowPagesAndCreateIfNotExists(workflow.workflowId);
      
      // 为每个页面设置排序索引
      pages.forEach((page) => {
        pageIdOrderMap.set(page.id, appSortIndex);
      });

      // 将页面添加到对应分组
      const pageIds = pages.map(page => page.id);
      groupMap[groupKey].pageIds = uniq([...(groupMap[groupKey].pageIds || []), ...pageIds]);
    }

    // 对每个分组内的页面进行排序
    for (const [groupKey, group] of Object.entries(groupMap)) {
      group.pageIds = group.pageIds.sort((a, b) => {
        const aIndex = pageIdOrderMap.get(a) || 999999;
        const bIndex = pageIdOrderMap.get(b) || 999999;
        return aIndex - bIndex;
      });
    }

    // 保存所有分组
    for (const group of Object.values(groupMap)) {
      await this.workflowRepository.updatePageGroup(group.id, { 
        pageIds: group.pageIds,
        sortIndex: group.sortIndex 
      });
    }

    return clonedWorkflows;
  }

  public async forkBuiltInComfyuiWorkflowAssetsFromMarketPlace(teamId: string, creatorUserId: string) {
    return await this.comfyuiWorkflowAssetRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, creatorUserId);
  }
}
