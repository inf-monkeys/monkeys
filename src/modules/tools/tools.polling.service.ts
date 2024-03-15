import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { Task, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import os from 'os';
import { ToolsRepository } from '../../repositories/tools.repository';
import { AuthType, WorkerInputData } from './interfaces';

export const CONDUCTOR_TASK_DEF_NAME = 'monkeys';

@Injectable()
export class ToolsPollingService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  private getWorkerId() {
    return os.hostname();
  }

  private async requestExternalApi(task: Task) {
    const inpuData = task.inputData as WorkerInputData;
    const { __toolName, __apiInfo, __context, ...rest } = inpuData;
    const tool = await this.toolsRepository.getToolByName(__toolName);
    logger.info(`Start to execute tool: ${__toolName}`);
    if (!tool) {
      throw new Error(`Failed to execute tool "${__toolName}", may not exists or not functioning now.`);
    }
    if (!__apiInfo) {
      throw new Error(`Failed to execute tool "${__toolName}", __apiInfo is missing`);
    }
    const { method, path } = __apiInfo;
    const namespace = __toolName.split('__')[0];
    const server = await this.toolsRepository.getServerByNamespace(namespace);
    if (!server) {
      throw new Error(`Failed to execute worker "${__toolName}", may not exists or not functioning now.`);
    }
    const { type: authType, authorization_type = 'bearer', verification_tokens = {} } = server.auth;
    const headers: { [x: string]: string } = {
      'x-monkeys-appid': __context.appId,
      'x-monkeys-userid': __context.userId,
      'x-monkeys-teamid': __context.teamId,
    };
    switch (authType) {
      case AuthType.none:
        break;
      case AuthType.service_http:
        if (authorization_type !== 'bearer') {
          throw new Error(`Unsupported authorization_type: ${authorization_type}`);
        }
        const token = verification_tokens['monkeys'];
        if (!token) {
          throw new Error(`monkeys verification_token is empty`);
        }
        headers['authorization'] = `Bearer ${token}`;
        break;
      default:
        break;
    }
    const { data } = await axios({
      method,
      baseURL: server.baseUrl,
      url: path,
      data: rest,
      headers: headers,
    });
    logger.info(`Execute worker success: ${__toolName}`);
    return data;
  }

  private async workerHandler(task: Task) {
    try {
      const outputData = await this.requestExternalApi(task);
      return {
        outputData: outputData,
        status: 'COMPLETED',
      };
    } catch (error) {
      logger.error(error.message);
      return {
        outputData: {
          success: false,
          errMsg: error.message,
        },
        status: 'FAILED',
      };
    }
  }

  public async startPolling() {
    await conductorClient.metadataResource.registerTaskDef([
      {
        name: CONDUCTOR_TASK_DEF_NAME,
        inputKeys: [],
        outputKeys: [],
        retryCount: 0,
        timeoutSeconds: 86400,
        ownerEmail: 'dev@inf-monkeys.com',
      },
    ] as Array<TaskDef>);
    const manager = new TaskManager(
      conductorClient,
      [
        {
          taskDefName: CONDUCTOR_TASK_DEF_NAME,
          concurrency: config.conductor.polling.concurrency,
          pollInterval: config.conductor.polling.interval,
          execute: this.workerHandler.bind(this),
        },
      ],
      {
        options: {
          workerID: this.getWorkerId(),
        },
      },
    );
    manager.startPolling();
  }
}
