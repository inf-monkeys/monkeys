import { AssetType } from '@/common/typings/asset';
import { flatTasks } from '@/common/utils/conductor';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsReferenceService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  public async getWorkflowReference(teamId: string, assetType: AssetType, assetId: string) {
    const workflows = await this.workflowRepository.getAllWorkflows(teamId);
    return workflows.filter((workflow) => {
      const tasks: WorkflowTask[] = flatTasks(workflow.tasks);

      if (assetType === 'tools' || assetType === 'block') {
        return tasks.some((task) => {
          return task.name === assetId;
        });
      } else {
        // TODO: Add other asset types
        return false;
      }
    });
  }
}
