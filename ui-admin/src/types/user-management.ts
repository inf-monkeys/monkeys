export type PaginatedResponse<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: string[];
  photo?: string;
  lastLoginAt?: number;
  loginsCount: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  createdBy?: string;
};

export type CreateAdminAccountInput = {
  username: string;
  name: string;
  email: string;
  password: string;
};

export type UpdateAdminAccountInput = Partial<{
  username: string;
  name: string;
  email: string;
  isActive: boolean;
}>;

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nickname?: string;
  photo?: string;
  verified?: boolean;
  isBlocked?: boolean;
  lastLoginAt?: number;
  loginsCount?: number;
  createdTimestamp: number;
  updatedTimestamp: number;
};

export type CreateUserInput = {
  name: string;
  email: string;
  phone?: string;
  nickname?: string;
  password: string;
  verified?: boolean;
  isBlocked?: boolean;
};

export type UpdateUserInput = Partial<{
  name: string;
  email: string;
  phone?: string;
  nickname?: string;
  verified?: boolean;
  isBlocked?: boolean;
}>;

