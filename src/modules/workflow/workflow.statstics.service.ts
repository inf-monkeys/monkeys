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
    const data = await this.workflowRepository.getWorkflowExecutionStatisticsByWorkflowId(workflowId, createdTimestamp, endTimestamp);
    return data;
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
    const data = await this.workflowRepository.getWorkflowExecutionStatisticsByTeamId(teamId, createdTimestamp, endTimestamp);
    return data;
  }
}
