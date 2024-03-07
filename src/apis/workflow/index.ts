import useSWR from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useGetWorkflow = (workflowId: string, apikey?: string) =>
  useSWR<MonkeyWorkflow>(workflowId ? `/api/workflow/${workflowId}` : null, vinesFetcher({ apikey }));

export const getWorkflow = (workflowId: string) => vinesFetcher<MonkeyWorkflow | null>()(`/api/workflow/${workflowId}`);

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
