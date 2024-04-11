import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  ICreateVectorDB,
  IKnowledgeBase,
  IKnowledgeBaseFrontEnd,
  IVectorSupportedEmbeddingModel,
} from '@/apis/vector/typings.ts';

export const useKnowledgeBases = () =>
  useSWR<IKnowledgeBaseFrontEnd[] | undefined>('/api/knowledge-bases', vinesFetcher());

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

export const deleteVectorCollection = (collectionId: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/vector/collections/${collectionId}`);

export const deleteAllVectorAllData = (collectionId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/vector/collections/${collectionId}/delete-all-data`, {});
