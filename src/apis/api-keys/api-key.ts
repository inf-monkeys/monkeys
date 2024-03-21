import useSWR from 'swr';

import { IApiKey } from '@/apis/api-keys/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useApiKeyList = () => useSWR<IApiKey[] | undefined>('/api/apiKeys', vinesFetcher());

export const createApiKey = (desc: string) =>
  vinesFetcher<IApiKey, { desc: string }>({
    method: 'POST',
    useToast: true,
    simple: true,
  })('/api/apiKeys', {
    desc,
  });

export const revokeApiKey = (id: string) =>
  vinesFetcher<string, { id: string }>({ method: 'POST', useToast: true })(`/api/apiKeys/${id}/revoke`, {
    id,
  });
