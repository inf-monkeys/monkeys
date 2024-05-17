import useSWR from 'swr';

import { IComfyuiModel, IComfyuiWorkflow } from '@/apis/comfyui/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { BlockDefProperties } from '@inf-monkeys/vines';

export interface ImportComfyuiWorkflowParams {
  workflowType: string;
  imageUrl?: string;
  workflowApiJson?: any;

  [x: string]: any;
}

export const useComfyuiModels = () => useSWR<IComfyuiModel | undefined>('/api/comfyui/all-models', vinesFetcher());

export const importComfyuiWorkflow = (params: ImportComfyuiWorkflowParams) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/workflows`, params);

export const updateComfyuiWorkflowToolInput = (id: string, toolInput: BlockDefProperties[]) =>
  vinesFetcher({ method: 'PUT', simple: true })(`/api/comfyui/workflows/${id}`, {
    toolInput,
  });

export const useComfyuiWorkflow = (id?: string) =>
  useSWR<IComfyuiWorkflow | undefined>(id ? `/api/comfyui/workflows/${id}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const deleteComfyuiWorkflow = (id: string) => vinesFetcher({ method: 'DELETE' })(`/api/comfyui/workflows/${id}`);

export const useComfyuiWorkflows = () =>
  useSWR<IComfyuiWorkflow[] | undefined>('/api/comfyui/workflows', vinesFetcher());
