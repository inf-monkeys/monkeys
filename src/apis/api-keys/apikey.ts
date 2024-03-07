import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { IApiKey } from '@/apis/api-keys/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useApiKeyList = () => useSWR<IApiKey[] | undefined>('/api/apiKeys', vinesFetcher());

export const useCreateApiKey = () => useSWRMutation('/api/apiKeys', vinesFetcher({ method: 'POST' }));

export const revokeApiKey = (id: string) =>
  vinesFetcher<string, { id: string }>({ method: 'POST', useToast: true })(`/api/apiKeys/${id}/revoke`, {
    id,
  });
