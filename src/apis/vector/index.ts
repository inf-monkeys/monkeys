import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorDB,
  IVectorCollection,
  IVectorFrontEnd,
  IVectorSupportedEmbeddingModel,
} from '@/apis/vector/typings.ts';

export const useVectorCollections = () =>
  useSWR<IVectorFrontEnd[] | undefined>('/api/vector/collections', vinesFetcher());

export const useVectorCollection = (collectionId: string) =>
  useSWR<IVectorCollection | undefined>(
    collectionId ? `/api/vector/collections/${collectionId}` : null,
    vinesFetcher(),
  );

export const useVectorSupportedEmbeddingModels = () =>
  useSWR<IVectorSupportedEmbeddingModel[] | undefined>('/api/vector/supported-embedding-models', vinesFetcher());

export const useCreateVectorCollection = () =>
  useSWRMutation<{ name: string } | undefined, unknown, string, ICreateVectorDB>(
    '/api/vector/collections',
    vinesFetcher({ method: 'POST' }),
  );

export const deleteVectorCollection = (collectionId: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/vector/collections/${collectionId}`);

export const deleteAllVectorAllData = (collectionId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/vector/collections/${collectionId}/delete-all-data`, {});
