import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import queryString from 'query-string';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { WorkflowListQuery } from '@/apis/workflow/typings.ts';

export const useGetWorkflow = (workflowId: string, apikey?: string) =>
  useSWR<MonkeyWorkflow | undefined>(workflowId ? `/api/workflow/${workflowId}` : null, vinesFetcher({ apikey }));

export const getWorkflow = (workflowId: string) => vinesFetcher<MonkeyWorkflow | null>()(`/api/workflow/${workflowId}`);

export const useWorkflowList = (query: WorkflowListQuery = {}) =>
  useSWR<MonkeyWorkflow[] | undefined>(`/api/workflow/list?${queryString.stringify(query)}`, vinesFetcher());

export const updateWorkflow = (
  apikey: string,
  workflowId: string,
  workflowVersion: number,
  workflow: Partial<MonkeyWorkflow>,
) =>
  vinesFetcher<MonkeyWorkflow, Partial<MonkeyWorkflow>>({ method: 'PUT', simple: true, apikey })(
    `/api/workflow/${workflowId}`,
    {
      ...workflow,
      version: workflowVersion,
    },
  );

export const useUpdateWorkflow = (apikey: string, workflowId: string) =>
  useSWRMutation<MonkeyWorkflow | undefined, unknown, string | null, Partial<MonkeyWorkflow>>(
    workflowId ? `/api/workflow/${workflowId}` : null,
    vinesFetcher<MonkeyWorkflow>({ method: 'PUT', apikey }),
  );

export const useWorkflowVersions = (workflowId: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(workflowId ? `/api/workflow/${workflowId}/versions` : null, vinesFetcher());
