import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN, MQ_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config, isRedisConfigured } from '@/common/config';
import { logger } from '@/common/logger';
import { Mq } from '@/common/mq';
import { ExtendedToolDefinition } from '@/common/utils/define-tool';
import { sleep } from '@/common/utils/utils';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { Task, TaskDef, TaskManager } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { IncomingMessage } from 'http';
import os from 'os';
import { AuthType, WorkerInputData } from '../../common/typings/tools';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from './llm/llm.controller';
import { ToolsRegistryService } from './tools.registry.service';

export const CONDUCTOR_TASK_DEF_NAME = config.conductor.workerPrefix ? `${config.conductor.workerPrefix}monkeys` : 'monkeys';
export const TOOL_STREAM_RESPONSE_TOPIC = (workflowInstanceId: string) => {
  return `${config.server.appId}:workflow-execution:stream:${workflowInstanceId}`;
};

@Injectable()
export class ToolsPollingService {
  BUILT_IN_TOOLS: ExtendedToolDefinition[] = [];
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsRegistryService: ToolsRegistryService,
    @Inject(CACHE_TOKEN) private readonly cache: CacheManager,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
  ) {}

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

  private async getBuiltInTools() {
    if (this.BUILT_IN_TOOLS.length > 0) {
      return this.BUILT_IN_TOOLS;
    } else {
      const tools = await this.toolsRegistryService.getBuiltInTools();
      this.BUILT_IN_TOOLS = tools;
      return tools;
    }
  }

  private async isBuiltInTool(toolName: string) {
    const tools = await this.getBuiltInTools();
    return tools.find((tool) => tool.name === toolName);
  }

  private readIncomingMessage(
    message: IncomingMessage,
    callbacks?: {
      onDataCallback?: (chunk: any) => void;
      onEndCallback?: (result: any) => void;
    },
  ) {
    const { onDataCallback, onEndCallback } = callbacks || {};
    return new Promise<string>((resolve, reject) => {
      let responseData: string = '';
      message.on('data', (chunk) => {
        responseData += chunk;
        if (onDataCallback) {
          onDataCallback(chunk);
        }
      });
      message.on('end', () => {
        if (onEndCallback) {
          onEndCallback(responseData);
        }
        resolve(responseData);
      });
      message.on('error', (error) => {
        console.error('Error receiving response data:', error);
        reject(error);
      });
    });
  }

  private getToolOutputAsConfig(tool: ToolsEntity, inputData: WorkerInputData): 'json' | 'stream' {
    if (tool.name === `${LLM_NAMESPACE}:${LLM_COMPLETION_TOOL}` || tool.name === `${LLM_NAMESPACE}:${LLM_CHAT_COMPLETION_TOOL}`) {
      const { stream } = inputData;
      return stream ? 'stream' : 'json';
    }
    const { __advancedConfig } = inputData;
    const { outputAs = 'json' } = __advancedConfig || {};
    return outputAs;
  }

  private async monkeyToolHandler(task: Task) {
    const inputData = task.inputData as WorkerInputData;
    const { __toolName, __context, ...rest } = inputData;

    logger.info(`Start to execute tool: ${__toolName}`);

    if (!__toolName) {
      return {
        outputData: {
          success: false,
          errMsg: 'Failed to execute tool: __toolName is missing',
        },
        status: 'FAILED',
      };
    }

    const builtInTool = await this.isBuiltInTool(__toolName);
    if (builtInTool) {
      try {
        const result = await builtInTool.handler(rest);
        return {
          outputData: result,
          status: 'COMPLETED',
        };
      } catch (error) {
        return {
          outputData: {
            success: false,
            errMsg: error.message,
          },
          status: 'FAILED',
        };
      }
    }

    const tool = await this.toolsRepository.getToolByName(__toolName);
    if (!tool) {
      return {
        outputData: {
          success: false,
          errMsg: `Failed to execute tool "${__toolName}", may not exists or not functioning now.`,
        },
        status: 'FAILED',
      };
    }
    const apiInfo = tool.extra?.apiInfo;
    if (!apiInfo) {
      return {
        outputData: {
          success: false,
          errMsg: `Failed to execute tool "${__toolName}", apiInfo is missing`,
        },
        status: 'FAILED',
      };
    }
    const outputAs = this.getToolOutputAsConfig(tool, inputData);
    if (outputAs === 'stream' && !isRedisConfigured()) {
      throw new Error('Stream output is not supported without redis');
    }

    const { method, path } = apiInfo;
    const namespace = __toolName.split(':')[0];
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

    // 根据 server 的 rate_limiter 配置，限制并发请求
    if (server.rateLimiter) {
      const { maxConcurrentRequests } = server.rateLimiter;
      if (maxConcurrentRequests) {
        // use cache manager to store the current requests count
        const cacheKey = `${config.server.appId}:current_requests:${server.namespace}`;
        const currentRequestsStr = await this.cache.get(cacheKey);
        const currentRequests = parseInt(currentRequestsStr || '0');
        if (currentRequests >= maxConcurrentRequests) {
          return {
            outputData: {
              success: false,
              errMsg: `Failed to execute tool "${__toolName}": Concurrent requests exceed the limit: ${maxConcurrentRequests}`,
            },
            status: 'FAILED',
          };
        }
        await this.cache.set(cacheKey, currentRequests + 1);
      }
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
      const responseType = outputAs === 'json' ? 'json' : 'stream';
      const res = await axios({
        method,
        baseURL: server.baseUrl,
        url: this.replaceUrlParams(path, rest || {}),
        data: rest,
        headers: headers,
        responseType,
      });
      if (responseType === 'json') {
        logger.info(`Execute worker success: ${__toolName}`);
        const outputData = res.data;
        // 判断 outputData 是不是一个对象，否则报错
        if (typeof outputData !== 'object') {
          logger.warn(`Output data of tool ${__toolName} is not an object: `, outputData);
          throw new Error('Output data must be an object');
        }
        return {
          outputData,
          status: 'COMPLETED',
        };
      } else if (responseType === 'stream') {
        const data = res.data as IncomingMessage;
        await this.readIncomingMessage(data, {
          onDataCallback: (chunk) => {
            this.mq.publish(TOOL_STREAM_RESPONSE_TOPIC(task.workflowInstanceId), chunk.toString());
          },
        });
        logger.info(`Execute worker success: ${__toolName}`);
        return {
          outputData: {
            stream: true,
            message: 'This tool outputs stream data, can not displayed',
          },
          status: 'COMPLETED',
        };
      }
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
        if (outputAs === 'stream') {
          const data = error?.response?.data as IncomingMessage;
          let realData = '';
          await this.readIncomingMessage(data, {
            onEndCallback(result) {
              realData = result;
            },
          });
          await this.mq.publish(TOOL_STREAM_RESPONSE_TOPIC(task.workflowInstanceId), realData);
          await this.mq.publish(TOOL_STREAM_RESPONSE_TOPIC(task.workflowInstanceId), '[DONE]');
          return {
            outputData: {
              success: false,
              errMsg: `Execution failed: ${realData}`,
            },
            status: 'FAILED',
          };
        } else if (outputAs === 'json') {
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
    } finally {
      if (server.rateLimiter) {
        const { maxConcurrentRequests } = server.rateLimiter;
        if (maxConcurrentRequests) {
          const cacheKey = `${config.server.appId}:current_requests:${server.namespace}`;
          const currentRequestStr = await this.cache.get(cacheKey);
          const currentRequests = parseInt(currentRequestStr || '0');
          await this.cache.set(cacheKey, currentRequests - 1);
        }
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
