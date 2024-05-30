import { AssetType } from '@/common/typings/asset';
import { flatTasks } from '@/common/utils/conductor';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsReferenceService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  public async getWorkflowReference(teamId: string, assetType: AssetType, assetId: string) {
    const workflows = await this.workflowRepository.getAllWorkflows(teamId);
    const tools = await this.toolsRepository.listTools(teamId);
    return workflows.filter((workflow) => {
      const tasks: WorkflowTask[] = flatTasks(workflow.tasks);

      if (assetType === 'tools' || assetType === 'block') {
        return tasks.some((task) => {
          return task.name === assetId;
        });
      } else {
        return tasks.some((task) => {
          const { name, inputParameters } = task;
          const tool = tools.find((x) => x.name === name);
          if (!tool) {
            return false;
          }
          const inputVariables = tool.input || [];
          const knowledgeBaseInput = inputVariables.filter((x) => x.typeOptions?.assetType === assetType);
          if (!knowledgeBaseInput.length) {
            return false;
          }
          const knowledgeBaseInputKeys = knowledgeBaseInput.map((x) => x.name);
          return knowledgeBaseInputKeys.some((key) => {
            return inputParameters[key] === assetId;
          });
        });
      }
    });
  }
}
