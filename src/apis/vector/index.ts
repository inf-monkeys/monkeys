import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorData,
  ICreateVectorDB,
  IFullTextSearchParams,
  IFullTextSearchResult,
  IUploadDocument,
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

export const useUpdateVectorCollection = (collectionId?: string) =>
  useSWRMutation<
    IVectorCollection | undefined,
    unknown,
    string | null,
    Pick<ICreateVectorDB, 'displayName' | 'description' | 'iconUrl'>
  >(collectionId ? `/api/assets/text-collection/${collectionId}` : null, vinesFetcher({ method: 'PUT' }));

export const deleteVectorCollection = (collectionId: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/vector/collections/${collectionId}`);

export const deleteAllVectorAllData = (collectionId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/vector/collections/${collectionId}/delete-all-data`, {});

export const useAddVectorData = (collectionId: string) =>
  useSWRMutation<{ pk: string } | undefined, unknown, string | null, ICreateVectorData>(
    collectionId ? `/api/vector/collections/${collectionId}/records` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useTextSearch = (collectionId: string, params: IFullTextSearchParams, useVector = false) => {
  const { query, from = 0, size = 30, metadataFilter } = params;
  return useSWR<IFullTextSearchResult | undefined>(
    collectionId && params
      ? [
          `/api/vector/collections/${collectionId}/${useVector ? 'vector' : 'full-text'}-search`,
          {
            query,
            from,
            size,
            metadataFilter,
            ...(useVector ? {} : { sortByCreatedAt: !query }),
          },
        ]
      : null,
    (args) =>
      vinesFetcher<IFullTextSearchResult, IFullTextSearchParams>({ method: 'POST', simple: true })(
        ...(args as [string, IFullTextSearchParams]),
      ),
  );
};

export const updateVectorData = (
  collectionId: string,
  recordId: string,
  data: Pick<ICreateVectorData, 'text' | 'metadata'>,
) => vinesFetcher({ method: 'PUT', simple: true })(`/api/vector/collections/${collectionId}/records/${recordId}`, data);

export const deleteVectorData = (collectionId: string, recordId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/vector/collections/${collectionId}/records/${recordId}`);

export const useUploadDocumentToVectorCollection = (collectionId: string) =>
  useSWRMutation<{ taskId: string } | undefined, unknown, string | null, IUploadDocument>(
    collectionId ? `/api/vector/collections/${collectionId}/records` : null,
    vinesFetcher({ method: 'POST' }),
  );
