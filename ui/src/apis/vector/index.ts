import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorData,
  ICreateVectorDB,
  IFullTextSearchParams,
  IFullTextSearchResult,
  IKnowledgeBase,
  IKnowledgeBaseDocument,
  IKnowledgebaseTask,
  IUploadDocument,
  IVectorMetadataField,
  IVectorSupportedEmbeddingModel,
} from '@/apis/vector/typings.ts';

export const useKnowledgeBase = (knowledgeBaseId: string) =>
  useSWR<IKnowledgeBase | undefined>(
    knowledgeBaseId ? `/api/knowledge-bases/${knowledgeBaseId}` : null,
    vinesFetcher(),
  );

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

export const useUpdateKnowledgeBase = (knowledgeBaseId?: string) =>
  useSWRMutation<
    IKnowledgeBase | undefined,
    unknown,
    string | null,
    Pick<ICreateVectorDB, 'displayName' | 'description' | 'iconUrl'>
  >(knowledgeBaseId ? `/api/knowledge-bases/${knowledgeBaseId}` : null, vinesFetcher({ method: 'PUT' }));

export const deleteKnowledgeBase = (knowledgeBaseId: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/knowledge-bases/${knowledgeBaseId}`);

export const deleteAllKnowledgeBaseData = (knowledgeBaseId: string) =>
  vinesFetcher({ method: 'POST' })(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/delete-all-data`,
    {},
  );

export const useAddKnowledgeBaseSegment = (knowledgeBaseId: string) =>
  useSWRMutation<{ pk: string } | undefined, unknown, string | null, ICreateVectorData>(
    knowledgeBaseId ? `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/segments` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useSearchKnowledgeBase = (knowledgeBaseId: string, params: IFullTextSearchParams, useVector = false) => {
  const { query, from = 0, size = 30, metadata_filter } = params;
  return useSWR<IFullTextSearchResult | undefined>(
    knowledgeBaseId && params
      ? [
          `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/${useVector ? 'vector' : 'fulltext'}-search`,
          {
            query,
            from,
            size,
            metadata_filter,
            ...(useVector
              ? {
                  topK: 10,
                }
              : { sortByCreatedAt: !query }),
          },
        ]
      : null,
    (args) =>
      vinesFetcher<IFullTextSearchResult, IFullTextSearchParams>({
        method: 'POST',
        simple: true,
        responseResolver: (response) => {
          return response.json() as any;
        },
      })(...(args as [string, IFullTextSearchParams])),
  );
};

export const useKnowledgeBaseDocuments = (knowledgeBaseId: string) =>
  useSWR<
    | {
        list: IKnowledgeBaseDocument[];
      }
    | undefined
  >(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/documents`,
    vinesFetcher({
      responseResolver: (response) => {
        return response.json() as any;
      },
    }),
  );

export const useKnowledgeBaseMetadataFields = (knowledgeBaseId: string) =>
  useSWR<IVectorMetadataField[] | undefined>(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/metadata-fields`,
    vinesFetcher({
      responseResolver: (response) => {
        return response.json() as any;
      },
    }),
  );

export const updateSegment = (
  knowledgeBaseId: string,
  recordId: string,
  data: Pick<ICreateVectorData, 'text' | 'metadata'>,
) =>
  vinesFetcher({ method: 'PUT', simple: true })(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/segments/${recordId}`,
    data,
  );

export const deleteSegment = (knowledgeBaseId: string, recordId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/segments/${recordId}`,
  );

export const deleteKnowledgeBaseDocument = (knowledgeBaseId: string, documentId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(
    `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
  );

export const useUploadDocumentToKnowledgeBase = (knowledgeBaseId: string) =>
  useSWRMutation<{ taskId: string } | undefined, unknown, string | null, IUploadDocument>(
    knowledgeBaseId ? `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/documents` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useKnowledgeBaseTasks = (knowledgeBaseId: string) =>
  useSWR<
    | {
        list: IKnowledgebaseTask[];
      }
    | undefined
  >(
    knowledgeBaseId ? `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/tasks` : null,
    vinesFetcher({
      responseResolver: (response) => {
        return response.json() as any;
      },
    }),
  );

export const useKnowledgeBaseTaskDetail = (knowledgeBaseId: string, taskId: string) =>
  useSWR<IKnowledgebaseTask | undefined>(
    knowledgeBaseId && taskId
      ? `/api/tools/monkey_tools_knowledge_base/knowledge-bases/${knowledgeBaseId}/tasks/${taskId}`
      : null,
    vinesFetcher({
      responseResolver: (response) => {
        return response.json() as any;
      },
    }),
    {
      refreshInterval: 100,
    },
  );
