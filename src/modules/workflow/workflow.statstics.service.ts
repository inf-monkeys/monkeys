import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowStatisticsService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  public async getWorkflowStatistics(workflowId: string, createdTimestampStr: string, endTimestampStr: string) {
    if (!createdTimestampStr || !endTimestampStr) {
      throw new Error('startTimestamp and endTimestamp are required');
    }
    const createdTimestamp = parseInt(createdTimestampStr, 10);
    const endTimestamp = parseInt(endTimestampStr, 10);
    if (isNaN(createdTimestamp) || isNaN(endTimestamp)) {
      throw new Error('startTimestamp and endTimestamp must be a number');
    }

    const workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(workflowId);
    if (!workflow) {
      throw new Error('workflow not found');
    }

    const shortcutsFlowId = workflow?.shortcutsFlow?.toString()?.split(':')?.[0];
    if (shortcutsFlowId) {
      return await this.workflowRepository.getWorkflowExecutionStatisticsByWorkflowId(shortcutsFlowId, createdTimestamp, endTimestamp, true);
    }

    return await this.workflowRepository.getWorkflowExecutionStatisticsByWorkflowId(workflowId, createdTimestamp, endTimestamp);
  }

  public async getTeamWorkflowStatistics(teamId: string, createdTimestampStr: string, endTimestampStr: string) {
    if (!createdTimestampStr || !endTimestampStr) {
      throw new Error('startTimestamp and endTimestamp are required');
    }
    const createdTimestamp = parseInt(createdTimestampStr, 10);
    const endTimestamp = parseInt(endTimestampStr, 10);
    if (isNaN(createdTimestamp) || isNaN(endTimestamp)) {
      throw new Error('startTimestamp and endTimestamp must be a number');
    }
    return await this.workflowRepository.getWorkflowExecutionStatisticsByTeamId(teamId, createdTimestamp, endTimestamp);
  }
}
