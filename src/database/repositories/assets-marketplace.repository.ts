import { LlmModelEndpointType } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from '@/modules/assets/assets.marketplace.data';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_GENERATE_TEXT_TOOL, LLM_NAMESPACE } from '@/modules/tools/llm/llm.controller';
import { getDefaultModel } from '@/modules/tools/llm/llm.service';
import { SimpleTaskDef } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { uniq } from 'lodash';
import { ComfyuiWorkflowEntity } from '../entities/comfyui/comfyui-workflow.entity';
import { WorkflowMetadataEntity } from '../entities/workflow/workflow-metadata';
import { ComfyuiWorkflowAssetRepositroy } from './assets-comfyui-workflow.respository';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';
import { WorkflowRepository } from './workflow.repository';

@Injectable()
export class AssetsMarketPlaceRepository {
  constructor(
    private readonly workflowAssetsRepository: WorkflowAssetRepositroy,
    private readonly workflowRepository: WorkflowRepository,
    private readonly comfyuiWorkflowAssetsRepositroy: ComfyuiWorkflowAssetRepositroy,
  ) {}

  public async forkBuiltInWorkflowAssetsFromMarketPlace(
    teamId: string,
    creatorUserId: string,
    extraOptions?: {
      clonedComfyuiWorkflows: (ComfyuiWorkflowEntity & { forkFromId: string })[];
    },
  ) {
    const clonedWorkflows = await this.workflowAssetsRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, creatorUserId, (workflowMetadata: WorkflowMetadataEntity) => {
      const { tasks = [] } = workflowMetadata;
      for (const task of tasks) {
        if (task.name === `${LLM_NAMESPACE}:${LLM_CHAT_COMPLETION_TOOL}`) {
          const defaultModel = getDefaultModel(LlmModelEndpointType.CHAT_COMPLETIONS);
          if (defaultModel) {
            (task as SimpleTaskDef).inputParameters.model = defaultModel;
          }
        } else if (task.name === `${LLM_NAMESPACE}:${LLM_COMPLETION_TOOL}`) {
          const defaultModel = getDefaultModel(LlmModelEndpointType.COMPLITIONS);
          if (defaultModel) {
            (task as SimpleTaskDef).inputParameters.model = defaultModel;
          }
        } else if (task.name === `${LLM_NAMESPACE}:${LLM_GENERATE_TEXT_TOOL}`) {
          const defaultModel = getDefaultModel(LlmModelEndpointType.CHAT_COMPLETIONS);
          if (defaultModel) {
            (task as SimpleTaskDef).inputParameters.model = defaultModel;
          }
        } else if (task.name === 'comfyui:run_comfyui_workflow') {
          //TODO: comfyui namespace
          const newId = extraOptions?.clonedComfyuiWorkflows.find((w) => w.forkFromId === (task as SimpleTaskDef).inputParameters.workflow)?.id;
          if (newId) (task as SimpleTaskDef).inputParameters.workflow = newId;
        }
      }
      return {
        workflowId: generateDbId(),
      };
    });
    for (const workflow of clonedWorkflows) {
      const { forkFromId } = workflow;
      const originalMarketPlaceData = BUILT_IN_WORKFLOW_MARKETPLACE_LIST.find((x) => x.id === forkFromId);
      if (originalMarketPlaceData?.autoPinPage?.length) {
        const pages = await this.workflowRepository.listWorkflowPagesAndCreateIfNotExists(workflow.workflowId);

        const groupMap: Record<string, WorkflowPageGroupEntity> = {};
        const groups = uniq(originalMarketPlaceData.autoPinPage.flatMap((it) => Object.keys(it)));
        const groupIds = await this.workflowRepository.getPageGroupsAndCreateIfNotExists(teamId, groups);
        let groupIndex = 0;
        for (const group of groupIds) {
          groupMap[groups[groupIndex]] = group;
          groupIndex++;
        }

        for (const mapper of originalMarketPlaceData.autoPinPage) {
          for (const [groupName, pageTypes] of Object.entries(mapper)) {
            const type2PageIds = pages.filter((it) => pageTypes.includes(it.type)).map((it) => it.id);
            groupMap[groupName].pageIds = uniq([...(groupMap[groupName].pageIds ?? []), ...type2PageIds]);
          }
        }

        for (const group of Object.values(groupMap)) {
          await this.workflowRepository.updatePageGroup(group.id, { pageIds: group.pageIds });
        }
      }
    }
    return clonedWorkflows;
  }

  public async forkBuiltInComfyuiWorkflowAssetsFromMarketPlace(teamId: string, creatorUserId: string) {
    return await this.comfyuiWorkflowAssetsRepositroy.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, creatorUserId);
  }
}
