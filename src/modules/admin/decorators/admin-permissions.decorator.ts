import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

/**
 * 指定接口需要的权限
 * 使用方式：@AdminPermissions('user:read', 'user:write')
 */
export const AdminPermissions = (...permissions: string[]) =>
  SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
