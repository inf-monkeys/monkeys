import { IToolsRequest, ToolsReqContext } from '@/common/typings/request';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ToolsMiddleware implements NestMiddleware {
  constructor() {}

  async use(req: IToolsRequest, res: Response, next: () => void) {
    const context: ToolsReqContext = {
      appId: req.headers['x-monkeys-appid'] as string,
      userId: req.headers['x-monkeys-userid'] as string,
      teamId: req.headers['x-monkeys-teamid'] as string,
      workflowInstanceId: req.headers['x-monkeys-workflow-instanceid'] as string,
    };
    req.context = context;
    next();
  }
}
