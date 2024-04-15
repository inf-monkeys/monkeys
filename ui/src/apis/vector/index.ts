import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorData,
  ICreateVectorDB,
  IFullTextSearchParams,
  IFullTextSearchResult,
  IKnowledgeBase,
  IUploadDocument,
  IVectorSupportedEmbeddingModel,
  IVectorTask,
} from '@/apis/vector/typings.ts';

export const useKnowledgeBase = (collectionId: string) =>
  useSWR<IKnowledgeBase | undefined>(collectionId ? `/api/knowledge-bases/${collectionId}` : null, vinesFetcher());

export const useVectorSupportedEmbeddingModels = () =>
  useSWR<IVectorSupportedEmbeddingModel[] | undefined>(
    '/api/tools/monkey_tools_knowledge_base/helpers/embedding-models',
    vinesFetcher(),
  );

export const useCreateKnowledgeBase = () =>
  useSWRMutation<{ name: string } | undefined, unknown, string, ICreateVectorDB>(
    '/api/knowledge-bases',
    vinesFetcher({ method: 'POST' }),
  );

export const useUpdateVectorCollection = (collectionId?: string) =>
  useSWRMutation<
    IKnowledgeBase | undefined,
    unknown,
    string | null,
    Pick<ICreateVectorDB, 'displayName' | 'description' | 'iconUrl'>
  >(collectionId ? `/api/assets/text-collection/${collectionId}` : null, vinesFetcher({ method: 'PUT' }));

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

export const useUploadDocumentToVectorCollection = (collectionId: string) =>
  useSWRMutation<{ taskId: string } | undefined, unknown, string | null, IUploadDocument>(
    collectionId ? `/api/vector/collections/${collectionId}/records` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useVectorRelationWorkflow = (collectionId: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(
    collectionId ? `/api/workflow/text-collection-related/${collectionId}` : null,
    vinesFetcher(),
  );

export const useVectorTasks = (collectionId: string) =>
  useSWR<IVectorTask[] | undefined>(
    collectionId ? `/api/vector/collections/${collectionId}/tasks` : null,
    vinesFetcher(),
  );

export const useVinesTasksDetail = (collectionId: string, taskId: string) =>
  useSWR<IVectorTask | undefined>(
    collectionId && taskId ? `/api/vector/collections/${collectionId}/tasks/${taskId}` : null,
    vinesFetcher(),
    {
      refreshInterval: 100,
    },
  );
