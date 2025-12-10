import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSIONS_KEY } from '../decorators/admin-permissions.decorator';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

/**
 * Admin 权限守卫
 * 检查用户是否拥有接口所需的权限
 * SuperAdmin 自动拥有所有权限
 */
@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      ADMIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置权限要求，允许通过
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AdminUserDto = request.adminUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SuperAdmin 拥有所有权限
    if (user.isSuperAdmin) {
      return true;
    }

    // 检查用户是否拥有所有必需的权限
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
