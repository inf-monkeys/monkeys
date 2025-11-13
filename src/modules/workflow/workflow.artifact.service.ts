import { WorkflowArtifactEntity } from '@/database/entities/workflow/workflow-artifact.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkflowExecutionService } from './workflow.execution.service';

@Injectable()
export class WorkflowArtifactService {
  constructor(
    @InjectRepository(WorkflowArtifactEntity)
    private readonly workflowArtifactRepository: Repository<WorkflowArtifactEntity>,
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowMetadataRepository: Repository<WorkflowMetadataEntity>,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  async getWorkflowArtifacts(instanceId: string, teamId: string) {
    const execution = await this.workflowExecutionRepository.findOne({ where: { workflowInstanceId: instanceId, isDeleted: false } });

    if (!execution) {
      throw new ForbiddenException('No permission to access this workflow execution');
    }

    const workflowMetadata = await this.workflowMetadataRepository.findOne({
      where: { workflowId: execution.workflowId, teamId, isDeleted: false },
    });

    if (!workflowMetadata) {
      throw new ForbiddenException('No permission to access this workflow execution');
    }

    return await this.workflowArtifactRepository.find({
      where: { instanceId, isDeleted: false },
      order: { createdTimestamp: 'DESC' },
    });
  }

  async getWorkflowInstanceByArtfactUrl(url: string, teamId: string) {
    const artifact = await this.workflowArtifactRepository.findOne({ where: { url } });

    if (!artifact) {
      throw new NotFoundException('产物不存在');
    }

    const execution = await this.workflowExecutionService.getWorkflowExecutionSimpleDetail(teamId, artifact.instanceId);

    if (!execution) {
      throw new NotFoundException('工作流实例不存在或无权限访问');
    }

    return execution;
  }

  public async getTeamArtifacts(
    teamId: string,
    options: {
      page?: number;
      limit?: number;
      orderBy?: 'DESC' | 'ASC';
    } = {},
  ): Promise<{
    total: number;
    data: Array<{
      url: string;
      type: 'image' | 'video' | 'file';
      instanceId: string;
      workflowId?: string;
      status?: string | null;
      userId?: string;
      startTime?: number | null;
      endTime?: number | null;
      updateTime?: number | null;
      createdTimestamp?: number;
      updatedTimestamp?: number;
    }>;
    page: number;
    limit: number;
  }> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const orderBy = options.orderBy === 'ASC' ? 'ASC' : 'DESC';

    const teamWorkflows = await this.workflowMetadataRepository.find({
      where: { teamId, isDeleted: false },
      select: ['workflowId'],
    });

    const workflowIds = Array.from(new Set(teamWorkflows.map((metadata) => metadata.workflowId).filter(Boolean)));

    if (workflowIds.length === 0) {
      return {
        total: 0,
        data: [],
        page,
        limit,
      };
    }

    const [artifacts, total] = await this.workflowArtifactRepository.findAndCount({
      where: {
        isDeleted: false,
        execution: {
          workflowId: In(workflowIds),
          isDeleted: false,
          isTemporary: false,
        },
      },
      relations: {
        execution: true,
      },
      order: {
        createdTimestamp: orderBy,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const toNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) {
        return null;
      }
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    const data = artifacts
      .filter((artifact) => artifact.execution)
      .map((artifact) => ({
        url: artifact.url,
        type: artifact.type,
        instanceId: artifact.instanceId,
        workflowId: artifact.execution?.workflowId,
        status: artifact.execution?.status ?? null,
        userId: artifact.execution?.userId,
        startTime: toNumber(artifact.execution?.conductorStartTime),
        endTime: toNumber(artifact.execution?.conductorEndTime),
        updateTime: toNumber(artifact.execution?.conductorUpdateTime),
        createdTimestamp: toNumber(artifact.createdTimestamp) ?? undefined,
        updatedTimestamp: toNumber(artifact.updatedTimestamp) ?? undefined,
        teamId,
      }));

    return {
      total,
      data,
      page,
      limit,
    };
  }
}
