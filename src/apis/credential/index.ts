import useSWR from 'swr';

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
