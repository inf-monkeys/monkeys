import { config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { ToolsRepository } from '@/repositories/tools.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { AuthType } from './interfaces';

@Injectable()
export class ToolsForwardService {
  constructor(private readonly toolsRepository: ToolsRepository) {}

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
}
