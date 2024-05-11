import { LlmModelEndpointType } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '@/modules/tools/llm/llm.controller';
import { getModels } from '@/modules/tools/llm/llm.service';
import { SimpleTaskDef } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { WorkflowMetadataEntity } from '../entities/workflow/workflow-metadata';
import { WorkflowAssetRepositroy } from './assets-workflow.respository';

@Injectable()
export class AssetsMarketPlaceRepository {
  constructor(private readonly workflowAssetsRepository: WorkflowAssetRepositroy) {}

  public async forkBuiltInWorkflowAssetsFromMarketPlace(teamId: string, creatorUserId: string) {
    const clonedWorfklows = await this.workflowAssetsRepository.forkBuiltInWorkflowAssetsFromMarketPlace(teamId, creatorUserId, (workflowMetadata: WorkflowMetadataEntity) => {
      const { tasks = [] } = workflowMetadata;
      for (const task of tasks) {
        if (task.name === `${LLM_NAMESPACE}:${LLM_CHAT_COMPLETION_TOOL}`) {
          const models = getModels(LlmModelEndpointType.CHAT_COMPLETIONS);
          if (models.length) {
            (task as SimpleTaskDef).inputParameters.model = models[0].value;
          }
        } else if (task.name === `${LLM_NAMESPACE}:${LLM_COMPLETION_TOOL}`) {
          const models = getModels(LlmModelEndpointType.COMPLITIONS);
          if (models.length) {
            (task as SimpleTaskDef).inputParameters.model = models[0].value;
          }
        }
      }
      return {
        workflowId: generateDbId(),
      };
    });
    return clonedWorfklows;
  }
}
