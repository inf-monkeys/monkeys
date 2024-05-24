import { conductorClient } from '@/common/conductor';
import { AuthType } from '@/common/typings/tools';
import { readIncomingMessage } from '@/common/utils/stream';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { IncomingMessage } from 'http';
import { ToolsRegistryService } from '../tools/tools.registry.service';

@Injectable()
export class WorkflowLogService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly toolsRegistryService: ToolsRegistryService,
  ) {}

  public async getLogs(res: Response, taskId: string) {
    const task = await conductorClient.taskResource.getTask(taskId);
    if (!task) {
      return res.end();
    }
    const {
      inputData: { __toolName },
    } = task;
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
    const builtInTool = await this.toolsRegistryService.isBuiltInTool(__toolName);
    if (builtInTool) {
      return res.end();
    }
    const namespace = __toolName.split(':')[0];
    const server = await this.toolsRepository.getServerByNamespace(namespace);
    if (!server?.logEndpoint) {
      return res.end();
    }
    const logApi = server.logEndpoint.replace('{taskId}', taskId);
    const { type: authType, authorization_type = 'bearer', verification_tokens = {} } = server.auth;
    const headers: { [x: string]: string } = {};
    switch (authType) {
      case AuthType.none:
        break;
      case AuthType.service_http:
        if (authorization_type !== 'bearer') {
          return res.end();
        }
        const token = verification_tokens['monkeys'];
        if (!token) {
          return res.end();
        }
        headers['authorization'] = `Bearer ${token}`;
        break;
      default:
        break;
    }

    const response = await axios({
      method: 'GET',
      baseURL: server.baseUrl,
      url: logApi,
      responseType: 'stream',
      headers: headers,
    });
    const data = response.data as IncomingMessage;
    await readIncomingMessage(data, {
      onDataCallback: (chunk) => {
        chunk = chunk.toString();
        res.write(chunk);
      },
      onEndCallback() {
        res.end();
      },
    });
  }
}
