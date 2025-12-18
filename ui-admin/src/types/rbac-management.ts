export interface AdminPermission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: AdminPermission[];
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface CreateAdminRoleInput {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateAdminRoleInput {
  code?: string;
  name?: string;
  description?: string;
}

