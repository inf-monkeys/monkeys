import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequest } from '../typings/request';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<IRequest>();

  // 如果指定了字段名（如 'userId'），返回该字段
  if (data) {
    if (data === 'userId') {
      return request.userId;
    }
    // 如果有 user 对象，尝试从 user 对象获取
    return request.user?.[data];
  }

  // 默认返回 userId
  return request.userId;
});
