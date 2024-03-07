import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { ConductorClient, Task, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import os from 'os';
import { ToolsRepository } from '../infra/database/repositories/tools.repository';
import { WorkerInputData } from './interfaces';

@Injectable()
export class ToolsPollingService {
  private conductorClient: ConductorClient;
  private taskDefName: string = 'monkeys';
  constructor(private readonly toolsRepository: ToolsRepository) {
    this.conductorClient = new ConductorClient({
      serverUrl: config.conductor.baseUrl,
    });
  }

  private getWorkerId() {
    return os.hostname();
  }

  private async requestExternalApi(task: Task) {
    const inpuData = task.inputData as WorkerInputData;
    const { __toolName, ...rest } = inpuData;
    const block = await this.toolsRepository.getToolByName(__toolName);
    logger.info(`Start to execute tool: ${__toolName}`);
    if (!block) {
      throw new Error(`Failed to execute tool "${__toolName}", may not exists or not functioning now.`);
    }
    const query: { [x: string]: any } = {};
    const body: { [x: string]: any } = {};
    const path: { [x: string]: any } = {};
    const namespace = __toolName.split('__')[0];
    const server = await this.toolsRepository.getServerByNamespace(namespace);
    if (!server) {
      throw new Error(`Failed to execute worker "${__toolName}", may not exists or not functioning now.`);
    }
    const baseURL = server.api.url;
    const method = __toolName.split('__')[1];
    let url = __toolName.split('__')[2];
    for (const key in rest) {
      const value = rest[key];
      if (value === undefined || value === '') {
        continue;
      }
      const [where, name] = key.split('#');
      if (where === 'QUERY') {
        query[name] = value;
      } else if (where === 'BODY') {
        body[name] = value;
      } else if (where === 'PATH') {
        path[name] = value;
      }
    }

    if (Object.keys(path).length > 0) {
      for (const pathKey in path) {
        url = url.replace(`{${pathKey}}`, path[pathKey]).replace(pathKey, path[pathKey]);
      }
    }

    const { data } = await axios({
      method,
      baseURL,
      url,
      data: body,
      params: query,
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
    await this.conductorClient.metadataResource.registerTaskDef([
      {
        name: this.taskDefName,
        inputKeys: [],
        outputKeys: [],
        retryCount: 0,
        timeoutSeconds: 86400,
        ownerEmail: 'dev@inf-monkeys.com',
      },
    ] as Array<TaskDef>);
    const manager = new TaskManager(
      this.conductorClient,
      [
        {
          taskDefName: this.taskDefName,
          concurrency: 1,
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
