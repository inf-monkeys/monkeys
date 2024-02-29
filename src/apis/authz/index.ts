import useSWRMutation from 'swr/mutation';

import { useAuthzPostFetcher, usePostFetcher } from '@/apis/fetcher.ts';
import { IUser } from '@/components/router/guard/auth.ts';

export const useSmsVerifyCode = () => useSWRMutation('/api/users/verify/phone', usePostFetcher);

export const useLogin = () => useSWRMutation<string>('/api/users/login', usePostFetcher);

export const useSearchUsers = () =>
  useSWRMutation<
    IUser[],
    unknown,
    string,
    {
      keyword: string;
    }
  >('/api/users/search', useAuthzPostFetcher);
