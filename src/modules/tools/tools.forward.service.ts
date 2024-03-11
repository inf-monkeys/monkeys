import { ToolServiceConfig, config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ToolsForwardService {
  private tools: ToolServiceConfig[] = [];
  constructor(private readonly httpService: HttpService) {
    this.tools = config.tools;
  }

  public async forward(toolName: string, request: IRequest) {
    const tool = this.tools.find((x) => (x.name = toolName));
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    const { baseUrl } = tool;
    try {
      const resp$ = this.httpService.request({
        method: request.method,
        url: request.url,
        headers: {
          'x-monkeys-userid': request.userId,
          'x-monkeys-teamid': request.teamId,
          'x-monkeys-appid': config.server.appId,
        },
        data: request.body,
        baseURL: baseUrl,
      });
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error(`Request tool ${toolName} ` + e.response.data.message || e.response.data.error);
      } else {
        throw Error(`Request tool ${toolName} ` + e.message);
      }
    }
  }
}
