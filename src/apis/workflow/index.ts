import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import queryString from 'query-string';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { WorkflowListQuery } from '@/apis/workflow/typings.ts';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';

export const useGetWorkflow = (workflowId: string, version?: number, apikey?: string) =>
  useSWR<MonkeyWorkflow | undefined>(
    workflowId ? `/api/workflow/metadata/${workflowId}${version ? `?version=${version}` : ''}` : null,
    vinesFetcher({ apikey }),
  );

export const getWorkflow = (workflowId: string) =>
  vinesFetcher<MonkeyWorkflow | null>({ simple: true })(`/api/workflow/metadata/${workflowId}`);

export const useWorkflowList = (query: WorkflowListQuery = {}) =>
  useSWR<MonkeyWorkflow[] | undefined>(`/api/workflow/metadata?${queryString.stringify(query)}`, vinesFetcher());

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
  >(workflowId ? `/api/workflow/${workflowId}` : null, vinesFetcher({ method: 'PUT', apikey }));
