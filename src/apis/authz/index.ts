import useSWRMutation from 'swr/mutation';

import { usePostFetcher } from '@/apis/fetcher.ts';

export const useSmsVerifyCode = () => useSWRMutation('/api/users/verify/phone', usePostFetcher);

export const useLogin = () => useSWRMutation<string>('/api/users/login', usePostFetcher);
