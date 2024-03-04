import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useLogin = () => useSWRMutation<string>('/api/users/login', vinesFetcher({ method: 'POST', auth: false }));

export const sendSmsVerifyCode = (phone: string | number) =>
  vinesFetcher({ method: 'POST', simple: true, auth: false })(`/api/users/verify/phone`, { phoneNumber: phone });
