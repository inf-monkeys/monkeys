import { useAuthStore } from '@/store/auth';
import { UserRole, Permission } from '@/types/auth';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, login, logout } =
    useAuthStore();

  // 检查是否有特定角色
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  // 检查是否有任意一个角色
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role));
  };

  // 检查是否有所有角色
  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.every((role) => user.roles.includes(role));
  };

  // 检查是否有特定权限
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Super Admin 拥有所有权限
    if (user.roles.includes(UserRole.SUPER_ADMIN)) return true;

    // 检查权限列表
    return user.permissions?.includes(permission) ?? false;
  };

  // 检查是否有任意一个权限
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;

    // Super Admin 拥有所有权限
    if (user.roles.includes(UserRole.SUPER_ADMIN)) return true;

    return permissions.some((permission) =>
      user.permissions?.includes(permission)
    );
  };

  // 检查是否有所有权限
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;

    // Super Admin 拥有所有权限
    if (user.roles.includes(UserRole.SUPER_ADMIN)) return true;

    return permissions.every((permission) =>
      user.permissions?.includes(permission)
    );
  };

  // 是否是超级管理员
  const isSuperAdmin = (): boolean => {
    return hasRole(UserRole.SUPER_ADMIN);
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };
}
