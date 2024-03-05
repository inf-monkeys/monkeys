import useSWR from 'swr';

import { IUpdateUserInfo, IVinesUser } from '@/apis/authz/user/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useUser = () =>
  useSWR<IVinesUser>('/api/users', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateUserInfo = (data: IUpdateUserInfo) =>
  vinesFetcher<IVinesUser, IUpdateUserInfo>({ method: 'POST', simple: true })('/api/users/profile', data);

export const searchUsers = (keyword: string) =>
  vinesFetcher<
    IVinesUser[],
    {
      keyword: string;
    }
  >({ method: 'POST', simple: true })('/api/users/search', { keyword });
