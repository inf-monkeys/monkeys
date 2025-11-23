import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { ICreateModelTraining } from '@/schema/workspace/create-model-training';

import { IModelTraining } from './typings';

export const createModelTraining = (createModelTrainingDto: ICreateModelTraining) =>
  vinesFetcher<IAssetItem<IModelTraining>>({
    method: 'POST',
    simple: true,
  })('/api/model-training', createModelTrainingDto);

export const useGetModelTrainingList = () =>
  useSWR<IAssetItem<IModelTraining>[] | undefined>(`/api/model-training`, vinesFetcher());

export const useGetModelTraining = (modelTrainingId?: string | null) =>
  useSWR<IAssetItem<IModelTraining> | undefined>(
    modelTrainingId ? `/api/model-training/${modelTrainingId}` : null,
    vinesFetcher(),
  );

export const deleteModelTraining = (modelTrainingId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/model-training/${modelTrainingId}`);

export const updateModelTraining = (modelTrainingId: string, modelTraining: Partial<IAssetItem<IModelTraining>>) =>
  vinesFetcher<IAssetItem<IModelTraining>, Partial<IAssetItem<IModelTraining>>>({ method: 'PUT', simple: true })(
    `/api/model-training/${modelTrainingId}`,
    modelTraining,
  );

export const useGetPretrainedModels = (modelType: string = '2') =>
  useSWR<string[] | undefined>(
    `/api/model-training/pretrained-models?model_type=${modelType}`,
    vinesFetcher({ wrapper: (data: any) => (Array.isArray(data) ? data : []) }),
  );

export const useGetLoraModels = (modelTrainingId?: string) =>
  useSWR<string[] | undefined>(
    modelTrainingId ? `/api/model-training/pretrained-models?model_type=1&model_training_id=${modelTrainingId}` : null,
    vinesFetcher({ wrapper: (data: any) => (Array.isArray(data) ? data : []) }),
  );
