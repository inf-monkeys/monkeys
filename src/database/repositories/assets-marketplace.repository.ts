import { LlmModelEndpointType } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { BUILT_IN_WORKFLOW_MARKETPLACE_LIST } from '@/modules/assets/assets.marketplace.data';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_GENERATE_TEXT_TOOL, LLM_NAMESPACE } from '@/modules/tools/llm/llm.controller';
import { getDefaultModel } from '@/modules/tools/llm/llm.service';
import { SimpleTaskDef } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { WorkflowMetadataEntity } from '../entities/workflow/workflow-metadata';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';
import { WorkflowRepository } from './workflow.repository';

@Injectable()
export class AssetsMarketPlaceRepository {
  constructor(
    private readonly workflowAssetsRepository: WorkflowAssetRepositroy,
    private readonly workflowRepository: WorkflowRepository,
  ) {}

  public async forkBuiltInWorkflowAssetsFromMarketPlace(teamId: string, creatorUserId: string) {
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
        for (const pageType of originalMarketPlaceData.autoPinPage) {
          const page = pages.find((x) => x.type === pageType);
          if (page) {
            await this.workflowRepository.updatePagePinStatus(teamId, page.id, true);
          }
        }
      }
    }
    return clonedWorkflows;
  }
}
