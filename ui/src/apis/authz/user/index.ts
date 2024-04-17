import useSWR from 'swr';

import { IUpdateUserInfo, IVinesUser } from '@/apis/authz/user/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useUser = () =>
  useSWR<IVinesUser | undefined>('/api/users/profile', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const getUser = () => vinesFetcher<IVinesUser>({ simple: true })('/api/users/profile');

export const updateUserInfo = (data: IUpdateUserInfo) =>
  vinesFetcher<IVinesUser, IUpdateUserInfo>({ method: 'PUT', simple: true })('/api/users/profile', data);

export const searchUsers = (keyword: string) =>
  vinesFetcher<
    IVinesUser[],
    {
      keyword: string;
    }
  >({ method: 'POST', simple: true })('/api/users/search', { keyword });
