import { WorkflowMetadataEntity } from '@/entities/workflow/workflow';
import { WorkflowExecutionEntity } from '@/entities/workflow/workflow-execution';
import { WorkflowTriggerType } from '@/entities/workflow/workflow-trigger';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, ObjectId, Repository } from 'typeorm';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowMetadataRepository: Repository<WorkflowMetadataEntity>,
  ) {}

  public async findByCondition(condition: Partial<WorkflowMetadataEntity>) {
    return await this.workflowMetadataRepository.find({
      where: {
        ...condition,
        isDeleted: false,
      },
    });
  }

  public async getWorkflowById(id: string, version: number) {
    return await this.workflowMetadataRepository.findOne({
      where: {
        id: new ObjectId(id),
        version,
        isDeleted: false,
      },
    });
  }

  public async findWorkflowByIds(ids: string[]) {
    if (!ids?.length) {
      return [];
    }
    return await this.workflowMetadataRepository.find({
      where: {
        id: In(ids.map((id) => new ObjectId(id))),
        isDeleted: false,
      },
    });
  }

  public async findExecutionsByWorkflowInstanceIds(workflowInstanceIds: string[]) {
    if (!workflowInstanceIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        workflowInstanceId: In(workflowInstanceIds),
      },
    });
  }

  public async findExecutionsByChatSessionId(chatSessionId: string) {
    return await this.workflowExecutionRepository.find({
      where: {
        chatSessionId: chatSessionId,
      },
    });
  }

  public async findExecutionsByChatSessionIds(chatSessionIds: string[]) {
    if (!chatSessionIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        chatSessionId: In(chatSessionIds),
      },
    });
  }

  public async findExecutionsByTriggerTypes(triggerTypes: WorkflowTriggerType[]) {
    if (!triggerTypes?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        triggerType: In(triggerTypes),
      },
    });
  }

  public async findExecutionsByUserIds(userIds: string[]) {
    if (!userIds?.length) {
      return [];
    }
    return await this.workflowExecutionRepository.find({
      where: {
        userId: In(userIds),
      },
    });
  }
}
