import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useBindWeWorkProviderIdToUser = () =>
  useSWRMutation<string | undefined, unknown, string, { code: string }>(
    '/api/auth/oauth/wework/bind',
    vinesFetcher({ method: 'POST' }),
  );

export const getWeWorkOAuthInfo = () =>
  vinesFetcher<{ corpId: string; agentid: string; redirect_uri: string }>({ method: 'GET', auth: false })(
    '/api/auth/oauth/wework/info',
  );
