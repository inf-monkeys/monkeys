import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { useAuthzGetFetcher, useAuthzPostFetcher } from '@/apis/fetcher.ts';
import { IApiKey } from '@/apis/settings/typings.ts';

export const useApiKeyList = () => useSWR<IApiKey[]>('/api/apiKeys', useAuthzGetFetcher);

export const useCreateApiKey = () => useSWRMutation('/api/apiKeys', useAuthzPostFetcher);

export const useRevokeApiKey = (id: string) =>
  useSWRMutation<boolean>(`/api/apiKeys/${id}/revoke`, useAuthzPostFetcher);
