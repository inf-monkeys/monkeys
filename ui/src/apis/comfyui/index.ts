import useSWR from 'swr';

import { ToolProperty } from '@inf-monkeys/monkeys';

import {
  IComfyuiModel,
  IComfyuiServer,
  IComfyuiWorkflow,
  IComfyuiWorkflowDependency,
  IComfyuiWorkflowDependencyNode,
} from '@/apis/comfyui/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

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

export const updateComfyuiWorkflow = (
  id: string,
  data: {
    toolInput?: ToolProperty[];
    toolOutput?: ToolProperty[];
    workflow?: any;
    workflowApi?: any;
  },
) => vinesFetcher({ method: 'PUT', simple: true })(`/api/comfyui/workflows/${id}`, data);

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
  dependencies: { nodes: IComfyuiWorkflowDependencyNode[] },
) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/dependencies`, {
    serverAddress,
    dependencies,
  });

export const installComfyfile = (serverAddress: string, workflowId: string) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/comfyui/workflows/${workflowId}/install`, {
    serverAddress,
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
