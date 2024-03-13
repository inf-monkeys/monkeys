import { calculateTimeDifference, getNextCronTimestamp } from '@/common/utils/cron';
import { WorkflowTriggerType, WorkflowTriggersEntity } from '@/entities/workflow/workflow-trigger';
import { Injectable } from '@nestjs/common';
import * as uuid from 'uuid';
import { WorkflowRepository } from '../../repositories/workflow.repository';
import { CreateWorkflowTriggerDto } from './dto/req/create-trigger.dto';
import { UpdateWorkflowTriggerDto } from './dto/req/update-trigger.dto';

@Injectable()
export class WorkflowTriggerService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  public async deleteWorkflowTrigger(workflowId: string, triggerId: string) {
    return await this.workflowRepository.deleteTrigger(workflowId, triggerId);
  }

  public async listWorkflowTriggers(workflowId: string, version: number) {
    return await this.workflowRepository.listWorkflowTriggers(workflowId, version);
  }

  public async createWorkflowTrigger(workflowId: string, triggerConfig: CreateWorkflowTriggerDto) {
    const { triggerType, cron, enabled = true, webhookConfig, version } = triggerConfig;

    let nextTriggerTime = undefined;
    if (triggerType === WorkflowTriggerType.SCHEDULER) {
      if (!cron) {
        throw new Error(`${triggerType} 类型的触发器必须设置 cron 参数`);
      }
      const { interval } = calculateTimeDifference(cron);
      // 允许最短时间间隔：暂时设置 1 分钟
      if (interval < 60 * 1000) {
        throw new Error(`触发器最少允许设置 1 分钟时间间隔`);
      }
      nextTriggerTime = getNextCronTimestamp(cron);
    }

    if (triggerType === WorkflowTriggerType.WEBHOOK) {
      if (!webhookConfig) {
        throw new Error(`${triggerType} 类型的触发器必须设置 webhookConfig 参数`);
      }
    }

    const newTrigger: Partial<WorkflowTriggersEntity> = {
      workflowId,
      workflowVersion: version,
      type: triggerType,
      enabled,
      webhookConfig,
    };

    if (cron) {
      newTrigger.cron = cron;
    }
    if (nextTriggerTime) {
      newTrigger.nextTriggerTime = nextTriggerTime;
    }
    if (triggerType === WorkflowTriggerType.WEBHOOK) {
      newTrigger.webhookPath = uuid.v4();
    }
    await this.workflowRepository.createWorkflowTrigger(newTrigger);
  }

  public async updateWorkflowTrigger(workflowId: string, triggerId: string, triggerConfig: UpdateWorkflowTriggerDto) {
    const { type: triggerType, cron, enabled, webhookConfig } = triggerConfig;

    let nextTriggerTime = undefined;
    if (triggerType === WorkflowTriggerType.SCHEDULER) {
      if (!cron) {
        throw new Error(`${triggerType} 类型的触发器必须设置 cron 参数`);
      }
      const { interval } = calculateTimeDifference(cron);
      // 允许最短时间间隔：暂时设置 1 分钟
      if (interval < 60 * 1000) {
        throw new Error(`触发器最少允许设置 1 分钟时间间隔`);
      }
      nextTriggerTime = getNextCronTimestamp(cron);
    }

    const trigger = await this.workflowRepository.getWorkflowTrigger(workflowId, triggerId);

    if (!trigger) {
      throw new Error('触发器不存在！');
    }

    trigger.type = triggerType;
    if (enabled !== undefined) {
      trigger.enabled = enabled;
      if (enabled) {
        // 将其他触发器都设置为禁用
        await this.workflowRepository.disableAllTriggers(workflowId);
      }
    }

    if (cron) {
      trigger.cron = cron;
    }
    if (nextTriggerTime) {
      trigger.nextTriggerTime = nextTriggerTime;
    }

    if (webhookConfig) {
      trigger.webhookConfig = webhookConfig;
    }

    return await this.workflowRepository.saveWorkflowTrigger(trigger);
  }
}
