import useSWR from 'swr';
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite';

import { vinesFetcher } from '@/apis/fetcher';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
export const useWorkflowExecutionOutputs = (workflowId: string) =>
  useSWR<VinesWorkflowExecutionOutputListItem[] | undefined>(
    `/api/workflow/executions/${workflowId}/outputs`,
    vinesFetcher({ method: 'GET' }),
  );
export const useInfinitaeWorkflowExecutionOutputs = (
  workflowId: string,
  { limit = 10, orderBy = 'DESC' }: { limit?: number; orderBy?: string },
): SWRInfiniteResponse<VinesWorkflowExecutionOutputListItem[] | undefined> =>
  useSWRInfinite<VinesWorkflowExecutionOutputListItem[] | undefined>(
    (index, previousPageData) => {
      if (previousPageData && !previousPageData.length) return null;
      return `/api/workflow/executions/${workflowId}/outputs?limit=${limit}&page=${index + 1}&orderBy=${orderBy}`;
    },
    vinesFetcher({ method: 'GET' }),
    {
      initialSize: 1,
    },
  );

export const useWorkflowExecutionAllOutputs = ({ limit = 10, page = 1 }: { limit?: number; page?: number }) =>
  useSWR<VinesWorkflowExecutionOutputListItem[] | undefined>(
    `/api/workflow/executions/all/outputs?limit=${limit}&page=${page}`,
    vinesFetcher({ method: 'GET' }),
  );

export const useInfiniteWorkflowExecutionAllOutputs = ({
  limit = 10,
  orderBy = 'DESC',
}: {
  limit?: number;
  orderBy?: string;
}): SWRInfiniteResponse<VinesWorkflowExecutionOutputListItem[] | undefined> =>
  useSWRInfinite<VinesWorkflowExecutionOutputListItem[] | undefined>(
    (index, previousPageData) => {
      if (previousPageData && !previousPageData.length) return null;
      return `/api/workflow/executions/all/outputs?limit=${limit}&page=${index + 1}&orderBy=${orderBy}`;
    },
    vinesFetcher({ method: 'GET' }),
    {
      initialSize: 1,
      revalidateFirstPage: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      refreshInterval: 1000 * 2,
      revalidateAll: false,
    },
  );
