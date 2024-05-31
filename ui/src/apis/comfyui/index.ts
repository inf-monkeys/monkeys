import useSWR from 'swr';

import {
  IComfyuiModel,
  IComfyuiServer,
  IComfyuiWorkflow,
  IComfyuiWorkflowDependency,
  IComfyuiWorkflowDependencyUninstalledNode,
} from '@/apis/comfyui/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { BlockDefProperties } from '@inf-monkeys/vines';

export interface ImportComfyuiWorkflowParams {
  workflowType: string;
  imageUrl?: string;
  workflowApiJsonUrl?: string;
  workflowJsonUrl?: string;

  [x: string]: any;
}

export const useComfyuiModels = () => useSWR<IComfyuiModel | undefined>('/api/comfyui/all-models', vinesFetcher());

export const importComfyuiWorkflow = (params: ImportComfyuiWorkflowParams) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/workflows`, params);

export const updateComfyuiWorkflowToolInput = (id: string, toolInput: BlockDefProperties[]) =>
  vinesFetcher({ method: 'PUT', simple: true })(`/api/comfyui/workflows/${id}`, {
    toolInput,
  });

export const autoGenerateComfyuiWorkflowToolInput = (id: string) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/workflows/${id}/gene-input`, {});

export const useComfyuiWorkflow = (id?: string) =>
  useSWR<IComfyuiWorkflow | undefined>(id ? `/api/comfyui/workflows/${id}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const checkComfyuiDependencies = (id: string, serverAddress: string) =>
  vinesFetcher<IComfyuiWorkflowDependency>({ method: 'GET', simple: true })(
    `/api/comfyui/workflows/${id}/dependencies?serverAddress=${serverAddress}`,
  );

export const installComfyuiDependencies = (
  serverAddress: string,
  dependencies: { nodes: IComfyuiWorkflowDependencyUninstalledNode[] },
) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/dependencies`, {
    serverAddress,
    dependencies,
  });

export const deleteComfyuiWorkflow = (id: string) => vinesFetcher({ method: 'DELETE' })(`/api/comfyui/workflows/${id}`);

export const useComfyuiWorkflows = () =>
  useSWR<IComfyuiWorkflow[] | undefined>('/api/comfyui/workflows', vinesFetcher());

export const useComfyuiServers = () => useSWR<IComfyuiServer[] | undefined>('/api/comfyui/servers', vinesFetcher());

export interface ImportComfyuiServerParams {
  address: string;
  description: string;
}

export const importComfyuiServer = (params: ImportComfyuiServerParams) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/servers`, params);

export const deleteComfyuiServer = (address: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/comfyui/servers`, {
    address,
  });
