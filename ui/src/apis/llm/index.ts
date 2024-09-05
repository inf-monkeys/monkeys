import useSWR from 'swr';

import { I18nValue } from '@inf-monkeys/monkeys';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMModel } from '@/apis/llm/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const useLLMModels = () => useSWR<ILLMModel[] | undefined>('/api/llm-models', vinesFetcher());

export const createLLMChannel = (modelType: string, data: { [x: string]: any }) => {
  return vinesFetcher({ method: 'POST', simple: true })(`/api/oneapi/channels/${modelType}`, data);
};

export const deleteLLMModel = (modelId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/llm-models/${modelId}`);

export const updateLLMModel = (modelType: string, model: Partial<IAssetItem<ILLMModel>>) =>
  vinesFetcher<IAssetItem<ILLMModel>, Partial<IAssetItem<ILLMModel>>>({ method: 'PUT', simple: true })(
    `/api/oneapi/channels/${modelType}`,
    model,
  );

export const useLLMModel = (id?: string) =>
  useSWR<ILLMModel | undefined>(id ? `/api/llm-models/${id}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export interface IOneAPIModel {
  key: number;
  value: number;
  models: string[];
  displayName: I18nValue;
  text: string;
}
export const useOneAPIModels = () => useSWR<IOneAPIModel[] | undefined>('/api/oneapi/models', vinesFetcher());

export const updateTextModel = (modelId: string, model: Partial<IAssetItem<ILLMModel>>) =>
  vinesFetcher<IAssetItem<ILLMModel>, Partial<IAssetItem<ILLMModel>>>({ method: 'PUT', simple: true })(
    `/api/llm-models/${modelId}`,
    model,
  );
