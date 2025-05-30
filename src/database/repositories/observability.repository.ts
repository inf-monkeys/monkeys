import { generateDbId } from '@/common/utils';
import { ObservabilityPlatform, ObservabilityPlatformConfig } from '@/modules/workflow/interfaces/observability';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowObservabilityEntity } from '../entities/observability/workflow-observability';

@Injectable()
export class ObservabilityRepository {
  constructor(
    @InjectRepository(WorkflowObservabilityEntity)
    private readonly workflowObservabilityRepository: Repository<WorkflowObservabilityEntity>,
  ) {}

  public async createWorkflowObservability(teamId: string, workflowId: string, platform: ObservabilityPlatform, platformConfig: ObservabilityPlatformConfig, name?: string) {
    const entity: Partial<WorkflowObservabilityEntity> = {
      id: generateDbId(),
      isDeleted: false,
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      teamId,
      workflowId,
      platform,
      platformConfig,
      name,
    };
    await this.workflowObservabilityRepository.save(entity);
    return entity;
  }

  public async getWorkflowObservability(teamId: string, workflowId: string) {
    return this.workflowObservabilityRepository.find({
      where: {
        teamId,
        workflowId,
      },
    });
  }

  public async deleteWorkflowObservability(observabilityId: string) {
    await this.workflowObservabilityRepository.delete({
      id: observabilityId,
    });
  }
}
