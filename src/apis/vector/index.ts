import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorData,
  ICreateVectorDB,
  IFullTextSearchParams,
  IFullTextSearchResult,
  IKnowledgeBase,
  IKnowledgeBaseFrontEnd,
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

export const deleteKnowledgeBase = (knowledgeBaseName: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/knowledge-bases/${knowledgeBaseName}`);

export const deleteAllKnowledgeBaseData = (knowledgeBaseName: string) =>
  vinesFetcher({ method: 'POST' })(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseName}/delete-all-data`,
    {},
  );

export const useAddVectorData = (collectionId: string) =>
  useSWRMutation<{ pk: string } | undefined, unknown, string | null, ICreateVectorData>(
    collectionId ? `/api/vector/collections/${collectionId}/records` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useSearchKnowledgeBase = (knowledgeBaseName: string, params: IFullTextSearchParams, useVector = false) => {
  const { query, from = 0, size = 30, metadataFilter } = params;
  return useSWR<IFullTextSearchResult | undefined>(
    knowledgeBaseName && params
      ? [
          `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseName}/${useVector ? 'vector' : 'fulltext'}-search`,
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
