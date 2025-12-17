// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

// 权限枚举（预留，后续扩展）
export enum Permission {
  // 用户管理
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',

  // 管理员管理
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',

  // 团队管理
  TEAM_READ = 'team:read',
  TEAM_WRITE = 'team:write',
  TEAM_DELETE = 'team:delete',

  // 工具管理
  TOOL_READ = 'tool:read',
  TOOL_WRITE = 'tool:write',
  TOOL_DELETE = 'tool:delete',

  // 配置管理
  CONFIG_READ = 'config:read',
  CONFIG_WRITE = 'config:write',

  // 数据管理
  ASSET_READ = 'asset:read',
  ASSET_WRITE = 'asset:write',
  ASSET_DELETE = 'asset:delete',

  // 任务管理
  TASK_READ = 'task:read',
  TASK_MANAGE = 'task:manage',

  // 工作流管理
  WORKFLOW_READ = 'workflow:read',
  WORKFLOW_WRITE = 'workflow:write',
  WORKFLOW_DELETE = 'workflow:delete',
}

// 管理员用户信息
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  roles: UserRole[];
  permissions?: Permission[];
  isAdmin: boolean;
  createdTimestamp: number;
  lastLoginAt?: number;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: AdminUser;
}

// 认证状态
export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
