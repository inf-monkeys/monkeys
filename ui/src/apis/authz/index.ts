import useSWRMutation from 'swr/mutation';

import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useLoginByPassword = (useToast = true) =>
  useSWRMutation<
    { token: string } | undefined,
    unknown,
    string,
    { email: string; password: string; initialTeamId?: string }
  >(
    '/api/auth/password/login',
    vinesFetcher({
      method: 'POST',
      auth: false,
      responseResolver: async (r) => {
        const { code, data, message } = await r.json();

        if (code === 200 && data?.token) {
          return { token: data.token };
        } else if (useToast) {
          toast.warning(message);
        }
      },
    }),
  );

export const useLoginByPhone = () =>
  useSWRMutation<{ token: string } | undefined>('/api/auth/phone/login', vinesFetcher({ method: 'POST', auth: false }));

export const sendSmsVerifyCode = (phone: string | number) =>
  vinesFetcher({ method: 'POST', simple: true, auth: false })(`/api/auth/phone/send-sms`, { phoneNumber: phone });
