import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import FileSaver from 'file-saver';
import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IWorkflowRelatedAssetResult } from '@/apis/ugc/asset-typings.ts';
import { WorkflowListQuery } from '@/apis/workflow/typings.ts';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';

export const useGetWorkflow = (workflowId: string, version?: number) =>
  useSWR<MonkeyWorkflow | undefined>(
    workflowId ? `/api/workflow/metadata/${workflowId}${version ? `?version=${version}` : ''}` : null,
    vinesFetcher(),
  );

export const getWorkflow = (workflowId: string) =>
  vinesFetcher<MonkeyWorkflow | null>({ simple: true })(`/api/workflow/metadata/${workflowId}`);

export const useWorkflowList = (query: WorkflowListQuery = {}) =>
  useSWR<MonkeyWorkflow[] | undefined>(`/api/workflow/metadata?${qs.stringify(query)}`, vinesFetcher());

export const createWorkflow = (workflowParams: Partial<MonkeyWorkflow>) =>
  vinesFetcher<{ workflowId: string }>({ method: 'POST', simple: true })('/api/workflow/metadata', workflowParams);

export const cloneWorkflow = (workflowId: string) =>
  vinesFetcher<{
    workflowId: string;
  }>({ method: 'POST' })(`/api/workflow/metadata/${workflowId}/clone`);

export const deleteWorkflow = (workflowId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/workflow/metadata/${workflowId}`);

export const updateWorkflow = (
  apikey: string,
  workflowId: string,
  workflowVersion: number,
  workflow: Partial<MonkeyWorkflow>,
) =>
  vinesFetcher<MonkeyWorkflow, Partial<MonkeyWorkflow>>({ method: 'PUT', simple: true, apikey })(
    `/api/workflow/metadata/${workflowId}`,
    {
      ...workflow,
      version: workflowVersion,
    },
  );

export const useUpdateWorkflow = (apikey: string, workflowId: string) =>
  useSWRMutation<
    (IWorkflowValidation & { success: boolean }) | undefined,
    unknown,
    string | null,
    Partial<MonkeyWorkflow>
  >(workflowId ? `/api/workflow/metadata/${workflowId}` : null, vinesFetcher({ method: 'PUT', apikey }));

export const useWorkflowRelatedAssets = (workflowId?: string, version?: number) =>
  useSWR<IWorkflowRelatedAssetResult | undefined>(
    workflowId ? `/api/workflow/${workflowId}/related-assets${version ? `?version=${version}` : ''}` : null,
    vinesFetcher(),
  );

export const exportWorkflow = async (workflowId: string, name: string, version?: number) =>
  vinesFetcher({
    method: 'GET',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(await r.blob(), version ? `${name}(版本${version}).zip` : `${name}(全部版本).zip`);
    },
  })(
    version
      ? `/api/workflow/metadata/${workflowId}/export?version=${version}&exportAssets=1`
      : `/api/workflow/metadata/${workflowId}/export?exportAssets=1`,
  );

export interface WorkflowRateLimiter {
  version?: number;
  enabled?: boolean;
  windowMs?: number;
  max?: number;
}
