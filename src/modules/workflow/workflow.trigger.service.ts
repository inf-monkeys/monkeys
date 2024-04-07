import { enumToList, generateDbId } from '@/common/utils';
import { calculateTimeDifference, getNextCronTimestamp } from '@/common/utils/cron';
import { WorkflowTriggerType, WorkflowTriggersEntity } from '@/database/entities/workflow/workflow-trigger';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { TriggerTypeRepository } from '@/database/repositories/trigger-type.repository';
import { Injectable } from '@nestjs/common';
import * as uuid from 'uuid';
import { WorkflowRepository } from '../../database/repositories/workflow.repository';
import { TriggerDefinition, TriggerEndpointType } from '../tools/interfaces';
import { ToolsForwardService } from '../tools/tools.forward.service';
import { CreateWorkflowTriggerDto } from './dto/req/create-trigger.dto';
import { UpdateWorkflowTriggerDto } from './dto/req/update-trigger.dto';
import { WorkflowCustomTriggerInvokeService } from './workflow.custom-trigger-invoke.service';

export const BUILTIN_TRIGGERS: TriggerDefinition[] = [
  {
    displayName: '手动触发',
    type: WorkflowTriggerType.MANUALLY,
    icon: 'emoji:👆:#434343',
    description: '调试工作流时手动触发运行',
  },
  {
    displayName: '定时任务',
    type: WorkflowTriggerType.SCHEDULER,
    icon: 'emoji:⏰:#f2c1be',
    description: '按自定义任务计划运行工作流',
  },
  {
    displayName: 'Webhook',
    type: WorkflowTriggerType.WEBHOOK,
    icon: 'emoji:🔗:#f2c1be',
    description: '按照自定义 Webhook 触发工作流',
  },
];

@Injectable()
export class WorkflowTriggerService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly triggerTypesRepository: TriggerTypeRepository,
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsForwardService: ToolsForwardService,
    private readonly workflowCustomTriggerInvokeService: WorkflowCustomTriggerInvokeService,
  ) {}

  private isCustomTrigger(type: WorkflowTriggerType) {
    return !enumToList(WorkflowTriggerType).includes(type);
  }

  private async getTriggerActionEndpint(toolNamespace: string, type: TriggerEndpointType) {
    const toolServer = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!toolServer) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} not exists`);
    }
    if (!toolServer.triggerEndpoints) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} triggerEndpoints is missing`);
    }
    const triggerEndpoint = toolServer.triggerEndpoints.find((x) => x.type === type);
    if (!triggerEndpoint) {
      throw new Error(`INTERNAL SERVER ERROR: tool server ${toolNamespace} triggerEndpoint of ${type} is missing`);
    }
    return triggerEndpoint;
  }

  public async listTriggerTypes(): Promise<TriggerDefinition[]> {
    const customTriggers = await this.triggerTypesRepository.listTriggerTypes();
    return BUILTIN_TRIGGERS.concat(
      customTriggers.map((item) => ({
        displayName: item.displayName,
        description: item.description,
        icon: item.icon,
        properties: item.properties,
        type: item.type,
      })),
    );
  }

  public async deleteWorkflowTrigger(workflowId: string, triggerId: string) {
    const trigger = await this.workflowRepository.getWorkflowTrigger(triggerId);
    if (!trigger) {
      throw new Error('触发器不存在');
    }
    const triggerType = trigger.type;
    const isCustomTrigger = this.isCustomTrigger(triggerType);
    if (isCustomTrigger) {
      const toolNamespace = triggerType.split('__')[0];
      const { method, url } = await this.getTriggerActionEndpint(toolNamespace, TriggerEndpointType.delete);
      await this.toolsForwardService.request(toolNamespace, {
        method,
        url,
        data: {
          triggerId,
        },
      });
      return await this.workflowRepository.deleteTrigger(workflowId, triggerId);
    } else {
      return await this.workflowRepository.deleteTrigger(workflowId, triggerId);
    }
  }

  public async listWorkflowTriggers(workflowId: string, version: number) {
    return await this.workflowRepository.listWorkflowTriggers(workflowId, version);
  }

  public async createWorkflowTrigger(workflowId: string, triggerConfig: CreateWorkflowTriggerDto) {
    const { triggerType, cron, enabled = true, webhookConfig, version, extraData } = triggerConfig;

    let nextTriggerTime = undefined;
    let isCustomTrigger = false;
    let toolNamespace: string = undefined;
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
    } else if (triggerType === WorkflowTriggerType.WEBHOOK) {
      if (!webhookConfig) {
        throw new Error(`${triggerType} 类型的触发器必须设置 webhookConfig 参数`);
      }
    } else {
      // 否则是插件提供的触发器，需要调用插件的触发器接口
      isCustomTrigger = true;
      toolNamespace = triggerType.split('__')[0];
    }

    const triggerId = generateDbId();
    const newTrigger: Partial<WorkflowTriggersEntity> = {
      id: triggerId,
      workflowId,
      workflowVersion: version,
      type: triggerType,
      enabled,
      extraData,
    };

    if (webhookConfig) {
      newTrigger.webhookConfig;
    }
    if (cron) {
      newTrigger.cron = cron;
    }
    if (nextTriggerTime) {
      newTrigger.nextTriggerTime = nextTriggerTime;
    }
    if (triggerType === WorkflowTriggerType.WEBHOOK) {
      newTrigger.webhookPath = uuid.v4();
    }

    if (isCustomTrigger) {
      const { method, url } = await this.getTriggerActionEndpint(toolNamespace, TriggerEndpointType.create);
      await this.toolsForwardService.request(toolNamespace, {
        method,
        url,
        data: {
          triggerId,
          enabled,
          workflowId,
          worfklowVersion: version,
          extraData,
          triggerEndpoint: this.workflowCustomTriggerInvokeService.getCustomTriggerEndpoint(triggerId),
        },
      });
      await this.workflowRepository.createWorkflowTrigger(newTrigger);
    } else {
      // 在插件 tools 里面注册触发器
      await this.workflowRepository.createWorkflowTrigger(newTrigger);
    }
  }

  public async updateWorkflowTrigger(triggerId: string, updates: UpdateWorkflowTriggerDto) {
    const trigger = await this.workflowRepository.getWorkflowTrigger(triggerId);
    if (!trigger) {
      throw new Error('触发器不存在');
    }
    const { cron, enabled, webhookConfig, extraData } = updates;
    let nextTriggerTime = undefined;
    const triggerType = trigger.type;
    const isCustomTrigger = this.isCustomTrigger(triggerType);
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

    if (!trigger) {
      throw new Error('触发器不存在！');
    }

    trigger.type = triggerType;
    if (enabled !== undefined) {
      trigger.enabled = enabled;
    }
    if (extraData) {
      trigger.extraData = extraData;
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

    if (isCustomTrigger) {
      const toolNamespace = triggerType.split('__')[0];
      const { method, url } = await this.getTriggerActionEndpint(toolNamespace, TriggerEndpointType.update);
      await this.toolsForwardService.request(toolNamespace, {
        method,
        url,
        data: {
          triggerId,
          enabled,
        },
      });
      return await this.workflowRepository.saveWorkflowTrigger(trigger);
    } else {
      return await this.workflowRepository.saveWorkflowTrigger(trigger);
    }
  }
}
