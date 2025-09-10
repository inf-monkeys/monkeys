import { config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { API_NAMESPACE, SYSTEM_NAMESPACE } from '@/database/entities/tools/tools-server.entity';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { AuthType } from '../../common/typings/tools';
import { REACT_TOOL_NAMES, ReActToolsService } from './builtin/react-tools';
import { ToolsRegistryService } from './tools.registry.service';

@Injectable()
export class ToolsForwardService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly reactToolsService: ReActToolsService,
  ) {}

  private replaceUrlParams(url: string, params: { [x: string]: any }) {
    let resultUrl = url;

    // 遍历对象中的每个键值对
    for (const [key, value] of Object.entries(params)) {
      // 替换 URL 中的占位符
      resultUrl = resultUrl.replace(`{${key}}`, value);
    }

    return resultUrl;
  }

  public async forward(toolNamespace: string, request: IRequest) {
    const server = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!server) {
      throw new NotFoundException();
    }
    const {
      auth: { type: authType, authorization_type, verification_tokens },
    } = server;
    const headers: { [x: string]: string } = {
      'x-monkeys-appid': config.server.appId,
      'x-monkeys-userid': request.userId,
      'x-monkeys-teamid': request.teamId,
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
      method: request.method,
      url: request.url.replace(`/api/tools/${toolNamespace}`, ''),
      headers: headers,
      data: request.body,
      baseURL: server.baseUrl,
    });
    return data;
  }

  public async request<T>(toolNamespace: string, requestConfig: AxiosRequestConfig) {
    const server = await this.toolsRepository.getServerByNamespace(toolNamespace);
    if (!server) {
      throw new NotFoundException();
    }
    const {
      auth: { type: authType, authorization_type, verification_tokens },
    } = server;
    const headers: { [x: string]: string } = {
      'x-monkeys-appid': config.server.appId,
      'content-type': 'application/json',
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
    const { data } = await axios<T>({
      method: requestConfig.method,
      url: this.replaceUrlParams(requestConfig.url, requestConfig.data || requestConfig.params || {}),
      headers: headers,
      data: requestConfig.data,
      baseURL: server.baseUrl,
      params: requestConfig.params,
    });
    return data;
  }

  public async invoke<T>(toolName: string, reqData: { [x: string]: any }, context?: { sessionId?: string; maxSteps?: number; teamId?: string; userId?: string }) {
    const tool = await this.toolsRepository.getToolByName(toolName);
    const namespace = toolName.split(':')[0];

    // 处理 ReAct 专用工具
    if (REACT_TOOL_NAMES.includes(toolName as any)) {
      try {
        switch (toolName) {
          case 'ask_followup_question':
            return await this.reactToolsService.askFollowupQuestion(reqData as { question: string; suggestions?: string[] }, context);
          case 'new_task':
            return await this.reactToolsService.newTask(reqData as { message: string; todos?: string }, context);
          case 'update_todo_list':
            return await this.reactToolsService.updateTodoList(reqData as { todos: string }, context);
          case 'task_completion':
            return await this.reactToolsService.taskCompletion(reqData as { result: string; summary?: string }, context);
          default:
            throw new Error(`ReAct tool ${toolName} not implemented`);
        }
      } catch (error) {
        throw new Error(`ReAct tool ${toolName} execution failed: ${error.message}`);
      }
    }

    // 处理系统内置工具
    if (namespace === SYSTEM_NAMESPACE) {
      const builtInTool = await this.toolsRegistryService.isBuiltInTool(toolName);
      if (builtInTool && builtInTool.handler) {
        const result = await builtInTool.handler(reqData, {
          taskId: 'direct-call',
          workflowInstanceId: 'direct-call',
        });
        return result;
      } else {
        throw new Error(`Built-in tool ${toolName} not found or has no handler`);
      }
    }

    if (namespace === API_NAMESPACE) {
      const apiInfo = tool.extra?.apiInfo;
      const headers: { [x: string]: string } = {};
      const method = apiInfo.method;
      let url = apiInfo.url;
      if (apiInfo.credentialPlaceAt === 'header') {
        headers[apiInfo.credentialKey] = apiInfo.credentialValue;
      }
      if (apiInfo.credentialPlaceAt === 'query') {
        url = `${url}?${apiInfo.credentialKey}=${apiInfo.credentialValue}`;
      }
      if (apiInfo.credentialPlaceAt === 'body') {
        reqData[apiInfo.credentialKey] = apiInfo.credentialValue;
      }
      const { data } = await axios<T>({
        method: method,
        url: this.replaceUrlParams(url, reqData || {}),
        headers: headers,
        data: method.toLowerCase() === 'get' ? undefined : reqData,
        params: method.toLowerCase() === 'get' ? reqData : undefined,
      });
      return data;
    } else {
      const server = await this.toolsRepository.getServerByNamespace(tool.namespace);
      const apiInfo = tool.extra?.apiInfo;
      const { method, path } = apiInfo;
      if (!server) {
        throw new NotFoundException();
      }
      const {
        auth: { type: authType, authorization_type, verification_tokens },
      } = server;
      const headers: { [x: string]: string } = {
        'x-monkeys-appid': config.server.appId,
        'content-type': 'application/json',
      };

      // Add team and user context headers if provided
      if (context?.teamId) {
        headers['x-monkeys-teamid'] = context.teamId;
      }
      if (context?.userId) {
        headers['x-monkeys-userid'] = context.userId;
      }
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
      const { data } = await axios<T>({
        method: method,
        url: this.replaceUrlParams(path, reqData || {}),
        headers: headers,
        data: method.toLowerCase() === 'get' ? undefined : reqData,
        params: method.toLowerCase() === 'get' ? reqData : undefined,
        baseURL: server.baseUrl,
      });
      return data;
    }
  }
}
