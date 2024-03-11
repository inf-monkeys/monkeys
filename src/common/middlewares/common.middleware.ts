import { IRequest } from '@/common/typings/request';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class CommonMiddleware implements NestMiddleware {
  constructor() {}

  async use(req: IRequest, res: Response, next: () => void) {
    req.userId = req.headers['x-monkeys-userid'] as string;
    req.teamId = req.headers['x-monkeys-teamid'] as string;
    next();
  }
}
