import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequest } from '../typings/request';

export const CurrentTeam = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<IRequest>();
  return request.teamId;
});
