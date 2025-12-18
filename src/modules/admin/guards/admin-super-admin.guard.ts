import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

/**
 * 仅允许 SuperAdmin 访问的守卫
 */
@Injectable()
export class AdminSuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AdminUserDto | undefined = request.adminUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isSuperAdmin) {
      throw new ForbiddenException('仅超级管理员可操作');
    }

    return true;
  }
}

