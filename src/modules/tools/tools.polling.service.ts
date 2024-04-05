import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { sleep } from '@/common/utils/utils';
import { Task, TaskDef, TaskManager } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import os from 'os';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { AuthType, WorkerInputData } from './interfaces';

export const CONDUCTOR_TASK_DEF_NAME = config.conductor.workerPrefix ? `${config.conductor.workerPrefix}monkeys` : 'monkeys';

@Injectable()
export class ToolsPollingService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

  private getWorkerId() {
    return os.hostname();
  }

  private replaceUrlParams(url: string, params: { [x: string]: any }) {
    let resultUrl = url;

    // 遍历对象中的每个键值对
    for (const [key, value] of Object.entries(params)) {
      // 替换 URL 中的占位符
      resultUrl = resultUrl.replace(`{${key}}`, value);
    }

    return resultUrl;
  }

  private async monkeyToolHandler(task: Task) {
    const inpuData = task.inputData as WorkerInputData;
    const { __toolName, __apiInfo, __context, ...rest } = inpuData;
    const tool = await this.toolsRepository.getToolByName(__toolName);
    logger.info(`Start to execute tool: ${__toolName}`);
    if (!tool) {
      return {
        outputData: {
          success: false,
          errMsg: `Failed to execute tool "${__toolName}", may not exists or not functioning now.`,
        },
        status: 'FAILED',
      };
    }
    if (!__apiInfo) {
      return {
        outputData: {
          success: false,
          errMsg: `Failed to execute tool "${__toolName}", __apiInfo is missing`,
        },
        status: 'FAILED',
      };
    }
    const { method, path } = __apiInfo;
    const namespace = __toolName.split('$$')[0];
    const server = await this.toolsRepository.getServerByNamespace(namespace);
    if (!server) {
      return {
        outputData: {
          success: false,
          errMsg: `Failed to execute tool "${__toolName}", may not exists or not functioning now.`,
        },
        status: 'FAILED',
      };
    }
    const { type: authType, authorization_type = 'bearer', verification_tokens = {} } = server.auth;
    const headers: { [x: string]: string } = {
      'x-monkeys-appid': __context?.appId,
      'x-monkeys-userid': __context?.userId,
      'x-monkeys-teamid': __context?.teamId,
    };
    switch (authType) {
      case AuthType.none:
        break;
      case AuthType.service_http:
        if (authorization_type !== 'bearer') {
          return {
            outputData: {
              success: false,
              errMsg: `Failed to execute tool "${__toolName}": Unsupported authorization_type: ${authorization_type}`,
            },
            status: 'FAILED',
          };
        }
        const token = verification_tokens['monkeys'];
        if (!token) {
          return {
            outputData: {
              success: false,
              errMsg: `Failed to execute tool "${__toolName}": monkeys verification_token is empty`,
            },
            status: 'FAILED',
          };
        }
        headers['authorization'] = `Bearer ${token}`;
        break;
      default:
        break;
    }

    try {
      const { data } = await axios({
        method,
        baseURL: server.baseUrl,
        url: this.replaceUrlParams(path, rest || {}),
        data: rest,
        headers: headers,
      });
      logger.info(`Execute worker success: ${__toolName}`);
      return {
        outputData: data,
        status: 'COMPLETED',
      };
    } catch (error) {
      logger.error(`执行 tool ${server.displayName}(${server.namespace} 的 ${__toolName} 失败: `, error);
      if (error.code === 'ECONNREFUSED') {
        return {
          outputData: {
            success: false,
            errMsg: `${server.displayName}(${server.namespace}) 服务暂时不可用`,
          },
          status: 'FAILED',
        };
      } else {
        // const statusCode = error.response?.status;
        const errData = error.response?.data;
        let errorMsg = errData || error.message;
        errorMsg = typeof errorMsg == 'object' && errorMsg != null ? JSON.stringify(errData) : errorMsg;
        return {
          outputData: {
            success: false,
            errMsg: `Execution failed: ${errorMsg}`,
          },
          status: 'FAILED',
        };
      }
    }
  }

  private async waitUntilConductorStartUp() {
    const healthCheckUrl = '/health';
    while (true) {
      try {
        const { data } = await axios.get<{
          healthResults: any[];
          suppressedHealthResults: any[];
          healthy: boolean;
        }>(healthCheckUrl, {
          baseURL: config.conductor.baseUrl.replace('/api', ''),
          auth: config.conductor.auth,
        });
        if (data.healthy) {
          break;
        }
      } catch (error) {
        logger.warn('Can not connect to conductor: ', error.message);
      } finally {
        await sleep(200);
      }
    }
  }

  public async startPolling() {
    await this.waitUntilConductorStartUp();
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
          execute: this.monkeyToolHandler.bind(this),
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
