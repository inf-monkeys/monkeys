import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { IRequest } from '../typings/request';

/**
 * TeamGuard - 确保请求包含有效的 teamId
 * 通常与 CompatibleAuthGuard 一起使用，CompatibleAuthGuard 会设置 request.teamId
 */
@Injectable()
export class TeamGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IRequest>();

    if (!request.teamId) {
      throw new ForbiddenException('团队ID是必需的');
    }

    return true;
  }
}



