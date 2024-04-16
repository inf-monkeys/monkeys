import { config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { AuthType } from '../../common/typings/tools';

@Injectable()
export class ToolsForwardService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

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
}
