import { WorkflowMetadataEntity, WorkflowOutputValue } from '@/entities/workflow/workflow';
import { WorkflowExecutionEntity } from '@/entities/workflow/workflow-execution';
import { WorkflowTriggerType, WorkflowTriggersEntity } from '@/entities/workflow/workflow-trigger';
import { BlockDefProperties, MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';

export interface FindWorkflowCondition {
  teamId: string;
  workflowId?: string;
  creatorUserId?: string;
}

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowMetadataRepository: Repository<WorkflowMetadataEntity>,
    @InjectRepository(WorkflowTriggersEntity)
    private readonly workflowTriggerRepository: Repository<WorkflowTriggersEntity>,
  ) {}

  public async findWorkflowByCondition(condition: FindWorkflowCondition) {
    return await this.workflowMetadataRepository.find({
      where: {
        ...condition,
        isDeleted: false,
      },
    });
  }

  public async createWorkflow(
    teamId: string,
    userId: string,
    workflowId: string,
    version: number,
    data: {
      name: string;
      description?: string;
      iconUrl?: string;
      tasks: MonkeyTaskDefTypes[];
      variables?: BlockDefProperties[];
      output: WorkflowOutputValue[];
    },
  ) {
    const { name, description, iconUrl, tasks, variables, output } = data;
    const entity: WorkflowMetadataEntity = {
      id: new ObjectId(),
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      version,
      teamId: teamId,
      creatorUserId: userId,
      name,
      description,
      iconUrl,
      tasks,
      variables,
      output,
    };
    await this.workflowMetadataRepository.save(entity);
    return entity;
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

  public async deleteWorkflow(teamId: string, workflowId: string) {
    await this.workflowMetadataRepository.update(
      {
        teamId,
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
    await this.workflowTriggerRepository.update(
      {
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async getWorklfowVersions(workflowId: string) {
    const versions = await this.workflowMetadataRepository.find({
      where: {
        workflowId,
        isDeleted: false,
      },
    });
    return versions;
  }

  public async getMaxVersion(teamId: string, workflowId: string) {
    const versions = await this.workflowMetadataRepository.find({
      where: {
        teamId,
        workflowId,
      },
    });
    if (versions?.length === 0) {
      return 1;
    }
    const maxVersion = Math.max(...versions.map((x) => x.version));
    return maxVersion;
  }

  public async findWebhookTrigger(webhookPath: string) {
    return await this.workflowTriggerRepository.findOne({
      where: {
        type: WorkflowTriggerType.WEBHOOK,
        webhookPath,
      },
    });
  }

  public async saveWorkflowExecution(workflowId: string, version: number, workflowInstanceId: string, userId: string, triggerType: WorkflowTriggerType, chatSessionId: string) {
    await this.workflowExecutionRepository.save({
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      workflowId,
      workflowVersion: version,
      workflowInstanceId,
      userId,
      triggerType,
      chatSessionId,
    });
  }

  public async deleteTrigger(workflowId: string, triggerId: string) {
    return await this.workflowTriggerRepository.update(
      {
        id: new ObjectId(triggerId),
        workflowId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async listWorkflowTriggers(workflowId: string, version: number) {
    return await this.workflowTriggerRepository.find({
      where: {
        workflowId,
        isDeleted: false,
        workflowVersion: version,
      },
    });
  }

  public async createWorkflowTrigger(data: Partial<WorkflowTriggersEntity>) {
    const entity: Partial<WorkflowTriggersEntity> = {
      ...data,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    await this.workflowTriggerRepository.save(entity);
  }

  public async getWorkflowTrigger(workflowId: string, triggerId: string) {
    const trigger = await this.workflowTriggerRepository.findOne({
      where: {
        workflowId,
        id: new ObjectId(triggerId),
      },
    });
    return trigger;
  }

  public async saveWorkflowTrigger(entity: WorkflowTriggersEntity) {
    return await this.workflowTriggerRepository.save(entity);
  }

  public async disableAllTriggers(workflowId: string) {
    await this.workflowTriggerRepository.update(
      {
        workflowId,
      },
      {
        enabled: false,
      },
    );
  }
}
