import useSWRMutation from 'swr/mutation';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { useAuthzPostFetcher, usePostFetcher } from '@/apis/fetcher.ts';
import { simplePost } from '@/apis/non-fetcher.ts';

export const sendSmsVerifyCode = (phone: string | number) =>
  simplePost('/api/users/verify/phone', { phoneNumber: phone });

export const useLogin = () => useSWRMutation<string>('/api/users/login', usePostFetcher);

export const useSearchUsers = () =>
  useSWRMutation<
    IVinesUser[],
    unknown,
    string,
    {
      keyword: string;
    }
  >('/api/users/search', useAuthzPostFetcher);
