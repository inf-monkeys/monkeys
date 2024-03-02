import { IUpdateUserInfo, IVinesUser } from '@/apis/authz/user/typings.ts';
import { authzPostFetcher } from '@/apis/non-fetcher.ts';

export const updateUserInfo = (data: IUpdateUserInfo) =>
  authzPostFetcher<IVinesUser, IUpdateUserInfo>('/api/users/profile', data);
