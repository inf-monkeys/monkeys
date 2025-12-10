export class AdminUserDto {
  id: string;
  username: string;
  name: string;
  email?: string;
  photo?: string;
  roles: string[]; // 角色代码列表
  permissions: string[]; // 权限代码列表
  isAdmin: true;
  isSuperAdmin: boolean;
  lastLoginAt?: number;
  loginsCount: number;
}

export class AdminLoginResponseDto {
  token: string;
  user: AdminUserDto;
}

export class SuperAdminInitResponseDto {
  created: boolean;
  username: string;
  password?: string; // 仅在创建时返回
  role: string;
  email: string;
  message: string;
}
