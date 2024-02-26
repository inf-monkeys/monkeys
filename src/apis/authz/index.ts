import useSWRMutation from 'swr/mutation';

import { usePostFetcher } from '@/apis/fetcher.ts';
export const useSmsVerifyCode = () => useSWRMutation('/api/account/verify/phone', usePostFetcher);

export const useLogin = () => useSWRMutation<string>('/api/account/login', usePostFetcher);
