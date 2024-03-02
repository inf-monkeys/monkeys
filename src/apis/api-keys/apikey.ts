import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { IApiKey } from '@/apis/api-keys/typings.ts';
import { useAuthzGetFetcher, useAuthzPostFetcher } from '@/apis/fetcher.ts';
import { authzPostFetcher } from '@/apis/non-fetcher.ts';

export const useApiKeyList = () => useSWR<IApiKey[]>('/api/apiKeys', useAuthzGetFetcher);

export const useCreateApiKey = () => useSWRMutation('/api/apiKeys', useAuthzPostFetcher);

export const revokeApiKey = (id: string) => authzPostFetcher<boolean, {}>(`/api/apiKeys/${id}/revoke`, {});
