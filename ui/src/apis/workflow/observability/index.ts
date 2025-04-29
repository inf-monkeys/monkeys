import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher';

import { IWorkflowObservability } from './typings';

export const useWorkflowObservability = (workflowId?: string | null) =>
  useSWR<IWorkflowObservability[] | undefined, unknown, string | null>(
    workflowId ? `/api/workflow/${workflowId}/observability` : null,
    vinesFetcher({ method: 'GET' }),
  );

export const createWorkflowObservability = (
  workflowId: string,
  observability: Pick<IWorkflowObservability, 'name' | 'platform' | 'platformConfig'>,
) => vinesFetcher({ method: 'POST', simple: true })(`/api/workflow/${workflowId}/observability`, observability);

export const deleteWorkflowObservability = (workflowId: string, observabilityId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/workflow/${workflowId}/observability/${observabilityId}`);
