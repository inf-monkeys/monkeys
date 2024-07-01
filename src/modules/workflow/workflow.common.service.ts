import { AssetType, MonkeyTaskDefTypes, MonkeyWorkflowDef } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { WorkflowRepository } from '../../database/repositories/workflow.repository';

@Injectable()
export class WorkflowCommonService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  ASSET_TYPE_SD_MODEL: AssetType = 'sd-model';
  ASSET_TYPE_LLM_MODEL: AssetType = 'llm-model';
  ASSET_TYPE_TEXT_COLLECTION: AssetType = 'knowledge-base';
  ASSET_TYPE_TABLE_COLLECTION: AssetType = 'sql-knowledge-base';

  public async getAllSubWorkflowsRecursive(tasks: MonkeyTaskDefTypes[]): Promise<MonkeyWorkflowDef[]> {
    // let subWorkflows: WorkflowMetadataEntity[] = [];
    // const { tasks } = workflowDef;
    // const flattedTasks: WorkflowTask[] = flatTasks(tasks);
    // const subWorkflowTasks = flattedTasks.filter((x) => x.type === BlockType.SUB_WORKFLOW);
    // for (const subWorkflowTask of subWorkflowTasks) {
    //   const { inputParameters } = subWorkflowTask;
    //   const { name, version } = inputParameters;
    //   const subWorkflow = await this.workflowRepository.getWorkflowById(name, version);
    //   const subWorkflowDef = subWorkflow.workflowDef;
    //   (subWorkflowTask as MonkeySubWorkflowTaskDef).subWorkflow = subWorkflow as any;
    //   subWorkflows.push(subWorkflow);
    //   const childSubWorkflows = await this.getAllSubWorkflowsRecursive(subWorkflowDef);
    //   subWorkflows = subWorkflows.concat(childSubWorkflows);
    // }
    // return subWorkflows;
    return [];
  }
}
