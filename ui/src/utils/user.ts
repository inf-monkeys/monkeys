import { IVinesUser } from '@/apis/authz/user/typings.ts';

export const asUserName = (user: Partial<IVinesUser> | null) => {
  if (user === null) return '管理员';
  return user?.name ?? user?.email ?? user?.phone ?? '匿名用户';
};
