import useSWR from 'swr';

import { IComfyuiModel, IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { ICreateComfyuiModelType } from '@/schema/workspace/create-comfyui-model-type.ts';

interface IManualUpdateResult {
  remove: number;
  update: number;
  create: number;
}

export const manualUpdateModelListFromServer = (serverId: string) =>
  vinesFetcher<IManualUpdateResult>({ method: 'POST', simple: true })(`/api/comfyui-models/manual-update`, {
    serverId,
  });

export const useComfyuiModelTypes = () =>
  useSWR<IComfyuiModelType[] | undefined>('/api/comfyui-models/types', vinesFetcher());

export const createComfyuiModelType = (params: ICreateComfyuiModelType) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui-models/types`, params);

export const deleteComfyuiModelType = (typeId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/comfyui-models/types/${typeId}`);

export const updateComfyuiModelTypesToInternals = () =>
  vinesFetcher<IManualUpdateResult>({ method: 'POST', simple: true })(`/api/comfyui-models/types/update-to-internals`);

export const updateComfyuiModelTypesFromInternals = () =>
  vinesFetcher<IManualUpdateResult>({ method: 'POST', simple: true })(
    `/api/comfyui-models/types/update-from-internals`,
  );

export const useComfyuiModel = (id?: string) =>
  useSWR<IComfyuiModel | undefined>(id ? `/api/comfyui-models/${id}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const useComfyuiModelListByTypeNameAndServerId = (typeName?: string, serverId?: string) =>
  useSWR<IComfyuiModel[] | undefined>(
    typeName && serverId ? `/api/comfyui-models/list?typeName=${typeName}&serverId=${serverId}` : null,
    vinesFetcher(),
    {
      refreshInterval: 600000,
    },
  );

export const updateComfyuiModel = (modelId: string, model: Partial<IComfyuiModel>) =>
  vinesFetcher<IComfyuiModel, Partial<IComfyuiModel>>({ method: 'PUT', simple: true })(
    `/api/comfyui-models/${modelId}`,
    model,
  );

export const updateComfyuiModelsToInternals = () =>
  vinesFetcher<IManualUpdateResult>({ method: 'POST', simple: true })(`/api/comfyui-models/update-to-internals`);

export const updateComfyuiModelsFromInternals = () =>
  vinesFetcher<IManualUpdateResult>({ method: 'POST', simple: true })(`/api/comfyui-models/update-from-internals`);
