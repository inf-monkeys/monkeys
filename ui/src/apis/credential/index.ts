import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import qs from 'qs';

import { IVinesCredentialDetail, IVinesCredentialType } from '@/apis/credential/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useCredentialTypes = () =>
  useSWR<IVinesCredentialType[] | undefined>('/api/credential-types', vinesFetcher());

export const useCredentials = (credentialType?: string) =>
  useSWR<IVinesCredentialDetail[] | undefined>(
    `/api/credentials${credentialType ? `?${qs.stringify({ credentialType })}` : ''}`,
    vinesFetcher(),
  );

export const deleteCredential = (id: string) => vinesFetcher({ method: 'DELETE' })(`/api/credentials/${id}`);

export const useCreateCredential = () =>
  useSWRMutation<
    IVinesCredentialDetail | undefined,
    unknown,
    string,
    {
      displayName: string;
      type: string;
      data: any;
    }
  >('/api/credentials', vinesFetcher({ method: 'POST' }));
