import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import FileSaver from 'file-saver';
import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IWorkflowRelatedAssetResult } from '@/apis/ugc/asset-typings.ts';
import { WorkflowListQuery } from '@/apis/workflow/typings.ts';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';

export const useGetWorkflow = (workflowId?: string, version?: number) =>
  useSWR<MonkeyWorkflow | undefined>(
    workflowId ? `/api/workflow/metadata/${workflowId}${version ? `?version=${version}` : ''}` : null,
    vinesFetcher(),
  );

export const useWorkflowList = (query: WorkflowListQuery = {}) =>
  useSWR<(MonkeyWorkflow & { id: string })[] | undefined>(
    `/api/workflow/metadata?${qs.stringify(query)}`,
    vinesFetcher(),
  );

export const getWorkflowList = (query: WorkflowListQuery = {}) =>
  vinesFetcher<MonkeyWorkflow[]>({ simple: true })(`/api/workflow/metadata?${qs.stringify(query)}`);

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

export const updateWorkflow = (workflowId: string, workflowVersion: number, workflow: Partial<MonkeyWorkflow>) =>
  vinesFetcher<MonkeyWorkflow, Partial<MonkeyWorkflow>>({ method: 'PUT', simple: true })(
    `/api/workflow/metadata/${workflowId}`,
    {
      ...workflow,
      version: workflowVersion,
    },
  );

export const useUpdateWorkflow = (workflowId: string) =>
  useSWRMutation<
    (IWorkflowValidation & { success: boolean }) | undefined,
    unknown,
    string | null,
    Partial<MonkeyWorkflow>
  >(workflowId ? `/api/workflow/metadata/${workflowId}` : null, vinesFetcher({ method: 'PUT' }));

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
      if (r.status !== 200) {
        throw new Error('导出失败');
      }
      FileSaver.saveAs(await r.blob(), version ? `${name}(版本${version}).zip` : `${name}(全部版本).zip`);
    },
  })(
    version
      ? `/api/workflow/metadata/${workflowId}/export?version=${version}&exportAssets=1`
      : `/api/workflow/metadata/${workflowId}/export?exportAssets=1`,
  );

export const useToggleWorkflowPermission = (workflowId: string) =>
  useSWRMutation<boolean | undefined, unknown, string | null, { notAuthorized: boolean }>(
    workflowId ? `/api/workflow/metadata/${workflowId}/permissions` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const workflowPermission = (workflowId: string) =>
  vinesFetcher<{
    notAuthorized: boolean;
  }>({ method: 'GET', simple: true })(`/api/workflow/metadata/${workflowId}/permissions`);
