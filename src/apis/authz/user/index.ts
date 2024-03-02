import useSWR from 'swr';

import { IUpdateUserInfo, IVinesUser } from '@/apis/authz/user/typings.ts';
import { useAuthzGetFetcher } from '@/apis/fetcher.ts';
import { authzPostFetcher } from '@/apis/non-fetcher.ts';

export const useUser = () =>
  useSWR<IVinesUser>('/api/users', useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateUserInfo = (data: IUpdateUserInfo) =>
  authzPostFetcher<IVinesUser, IUpdateUserInfo>('/api/users/profile', data);
