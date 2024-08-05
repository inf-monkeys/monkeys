import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useLoginByPassword = () =>
  useSWRMutation<{ token: string } | undefined, unknown, string, { email: string; password: string }>(
    '/api/auth/password/login',
    vinesFetcher({ method: 'POST', auth: false }),
  );

export const useLoginByPhone = () =>
  useSWRMutation<{ token: string } | undefined>('/api/auth/phone/login', vinesFetcher({ method: 'POST', auth: false }));

export const sendSmsVerifyCode = (phone: string | number) =>
  vinesFetcher({ method: 'POST', simple: true, auth: false })(`/api/auth/phone/send-sms`, { phoneNumber: phone });
