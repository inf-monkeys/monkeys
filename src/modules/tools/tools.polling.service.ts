import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN, MQ_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { LlmModelEndpointType, config } from '@/common/config';
import { logger } from '@/common/logger';
import { Mq } from '@/common/mq';
import { readIncomingMessage } from '@/common/utils/stream';
import { sleep } from '@/common/utils/utils';
import { API_NAMESPACE } from '@/database/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { CredentialsRepository } from '@/database/repositories/credential.repository';
import { Task, TaskDef, TaskManager } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { IncomingMessage } from 'http';
import os from 'os';
import { AuthType, WorkerInputData } from '../../common/typings/tools';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from './llm/llm.controller';
import { ToolsRegistryService } from './tools.registry.service';

export const CONDUCTOR_TASK_DEF_NAME = config.conductor.workerPrefix ? `${config.conductor.workerPrefix}${config.server.appId}` : config.server.appId;
export const TOOL_STREAM_RESPONSE_TOPIC = (workflowInstanceId: string) => {
  return `${config.server.appId}:workflow-execution:stream:${workflowInstanceId}`;
};

@Injectable()
export class ToolsPollingService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly credentialsRepository: CredentialsRepository,
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

  private isLlmChatTool(toolName: string): LlmModelEndpointType {
    if (toolName === `${LLM_NAMESPACE}:${LLM_CHAT_COMPLETION_TOOL}`) {
      return LlmModelEndpointType.CHAT_COMPLETIONS;
    }
    if (toolName === `${LLM_NAMESPACE}:${LLM_COMPLETION_TOOL}`) {
      return LlmModelEndpointType.COMPLITIONS;
    }
    return null;
  }

  private getToolOutputAsConfig(tool: ToolsEntity, inputData: WorkerInputData): 'json' | 'stream' {
    if (this.isLlmChatTool(tool.name)) {
      const { stream } = inputData;
      return stream ? 'stream' : 'json';
    }
    const { __advancedConfig } = inputData;
    const { outputAs = 'json' } = __advancedConfig || {};
    return outputAs;
  }

  private async monkeyToolHandler(task: Task) {
    const inputData = task.inputData as WorkerInputData;
    const { __toolName, __context, credential, ...rest } = inputData;

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

    const builtInTool = await this.toolsRegistryService.isBuiltInTool(__toolName);
    if (builtInTool) {
      try {
        const result = await builtInTool.handler(rest, {
          taskId: task.taskId,
          workflowInstanceId: task.workflowInstanceId,
        });
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

    if (credential?.id) {
      const credentialRecord = await this.credentialsRepository.getCredentialById(__context.teamId, credential.id);
      if (!credentialRecord) {
        return {
          outputData: {
            success: false,
            errMsg: `Failed to execute tool "${__toolName}", credential ${credential.id} not found`,
          },
          status: 'FAILED',
        };
      }
      credential.encryptedData = credentialRecord?.encryptedData;
    }

    const llmChatTool = this.isLlmChatTool(__toolName);
    const outputAs = this.getToolOutputAsConfig(tool, inputData);

    const namespace = __toolName.split(':')[0];
    let headers: { [x: string]: string } = {};
    let baseURL = undefined;
    let method = undefined;
    let url = undefined;
    let server = undefined;
    if (namespace === API_NAMESPACE) {
      method = apiInfo.method;
      url = apiInfo.url;
      if (apiInfo.credentialPlaceAt === 'header') {
        headers[apiInfo.credentialKey] = apiInfo.credentialValue;
      }
      if (apiInfo.credentialPlaceAt === 'query') {
        url = `${url}?${apiInfo.credentialKey}=${apiInfo.credentialValue}`;
      }
      if (apiInfo.credentialPlaceAt === 'body') {
        rest[apiInfo.credentialKey] = apiInfo.credentialValue;
      }
    } else {
      server = await this.toolsRepository.getServerByNamespace(namespace);
      if (!server) {
        return {
          outputData: {
            success: false,
            errMsg: `Failed to execute tool "${__toolName}", may not exists or not functioning now.`,
          },
          status: 'FAILED',
        };
      }

      baseURL = server.baseUrl;
      method = apiInfo.method;
      url = apiInfo.path;

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
      headers = {
        'x-monkeys-appid': __context?.appId,
        'x-monkeys-userid': __context?.userId,
        'x-monkeys-teamid': __context?.teamId,
        'x-monkeys-workflow-instanceid': task.workflowInstanceId,
        'x-monkeys-workflow-taskid': task.taskId,
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
    }

    try {
      const responseType = outputAs === 'json' ? 'json' : 'stream';
      const res = await axios({
        method,
        baseURL,
        url: this.replaceUrlParams(url, rest || {}),
        data: {
          ...(rest || {}),
          credential,
        },
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
        let llmOutput = '';
        const data = res.data as IncomingMessage;
        await readIncomingMessage(data, {
          onDataCallback: (chunk) => {
            chunk = chunk.toString();
            this.mq.publish(TOOL_STREAM_RESPONSE_TOPIC(task.workflowInstanceId), chunk);
            if (llmChatTool === LlmModelEndpointType.CHAT_COMPLETIONS) {
              const cleanedMessageStr = chunk.replace('data: ', '').trim();
              try {
                const parsedMessage = JSON.parse(cleanedMessageStr);
                const { choices = [] } = parsedMessage;
                const content = choices[0]?.delta?.content;
                llmOutput += content;
              } catch (error) {}
            } else if (llmChatTool === LlmModelEndpointType.COMPLITIONS) {
              const chunks = chunk.split('\n\n');
              for (const chunkItem of chunks) {
                try {
                  const cleanedMessageStr = chunkItem.replace('data: ', '').trim();
                  const parsedMessage = JSON.parse(cleanedMessageStr);
                  const { choices = [] } = parsedMessage;
                  const content = choices[0]?.text;
                  llmOutput += content;
                } catch (error) {}
              }
            }
          },
        });
        logger.info(`Execute worker success: ${__toolName}`);
        let outputData: { [x: string]: any } = {
          stream: true,
          message: 'This tool outputs stream data, can not displayed',
        };
        if (llmChatTool === LlmModelEndpointType.CHAT_COMPLETIONS) {
          const randomChatCmplId = 'chatcmpl-' + Math.random().toString(36).substr(2, 16);
          outputData = {
            id: randomChatCmplId,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: inputData.model,
            choices: [{ index: 0, message: { role: 'assistant', content: llmOutput }, logprobs: null, finish_reason: 'stop' }],
            usage: { prompt_tokens: undefined, completion_tokens: undefined, total_tokens: undefined },
            system_fingerprint: null,
          };
        } else if (llmChatTool === LlmModelEndpointType.COMPLITIONS) {
          const randomCmplId = 'cmpl-' + Math.random().toString(36).substr(2, 16);
          outputData = {
            id: randomCmplId,
            object: 'text_completion',
            created: Math.floor(Date.now() / 1000),
            model: inputData.model,
            choices: [{ text: llmOutput, index: 0, logprobs: null, finish_reason: 'length' }],
            usage: { prompt_tokens: 1, completion_tokens: 16, total_tokens: 17 },
          };
        }
        return {
          outputData: outputData,
          status: 'COMPLETED',
        };
      }
    } catch (error) {
      logger.error(`Execute tool ${__toolName} failed`, error.message);
      if (error.code === 'ECONNREFUSED') {
        return {
          outputData: {
            success: false,
            errMsg: `${__toolName} Service is not available`,
          },
          status: 'FAILED',
        };
      } else {
        // const statusCode = error.response?.status;
        if (outputAs === 'stream') {
          const data = error?.response?.data as IncomingMessage;
          let realData = '';
          await readIncomingMessage(data, {
            onEndCallback(result) {
              realData = result;
            },
          });
          await this.mq.publish(TOOL_STREAM_RESPONSE_TOPIC(task.workflowInstanceId), `data: ${realData}\n\n`);
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
      if (server?.rateLimiter) {
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
