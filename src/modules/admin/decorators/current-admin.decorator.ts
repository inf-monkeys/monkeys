import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

/**
 * 获取当前登录的管理员用户
 * 使用方式：@CurrentAdmin() user: AdminUserDto
 */
export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminUserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.adminUser;
  },
);
