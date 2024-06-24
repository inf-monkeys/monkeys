import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMModel } from '@/apis/llm/typings.ts';

export const useLLMModels = () => useSWR<ILLMModel[] | undefined>('/api/llm-models', vinesFetcher());

export const createLLMChannel = (channelId: string, data: { [x: string]: any }) => {
  return vinesFetcher({ method: 'POST', simple: true })(`/api/oneapi/channels/${channelId}`, data);
};

export const deleteLLMModel = (modelId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/llm-models/${modelId}`);

export const useLLMModel = (id?: string) =>
  useSWR<ILLMModel | undefined>(id ? `/api/llm-models/${id}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });
