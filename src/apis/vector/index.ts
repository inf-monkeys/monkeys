import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ICreateVectorDB, IVectorFrontEnd, IVectorSupportedEmbeddingModel } from '@/apis/vector/typings.ts';

export const useVectorCollections = () =>
  useSWR<IVectorFrontEnd[] | undefined>('/api/vector/collections', vinesFetcher());

export const useVectorSupportedEmbeddingModels = () =>
  useSWR<IVectorSupportedEmbeddingModel[] | undefined>('/api/vector/supported-embedding-models', vinesFetcher());

export const useCreateVectorCollection = () =>
  useSWRMutation<{ name: string } | undefined, unknown, string, ICreateVectorDB>(
    '/api/vector/collections',
    vinesFetcher({ method: 'POST' }),
  );
