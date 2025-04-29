import { Injectable } from '@nestjs/common';
import { ObservabilityRepository } from '../../database/repositories/observability.repository';
import { ObservabilityPlatform, ObservabilityPlatformConfig } from './interfaces/observability';

@Injectable()
export class WorkflowObservabilityService {
  constructor(private readonly observabilityRepository: ObservabilityRepository) { }

  public async getWorkflowObservabilityDataList(teamId: string, workflowId: string) {
    const workflowObservability = await this.observabilityRepository.getWorkflowObservability(teamId, workflowId);
    return workflowObservability;
  }

  public async createWorkflowObservability(teamId: string, workflowId: string, platform: ObservabilityPlatform, platformConfig: ObservabilityPlatformConfig, name?: string) {
    const workflowObservability = await this.observabilityRepository.createWorkflowObservability(teamId, workflowId, platform, platformConfig, name);
    return workflowObservability;
  }
}
