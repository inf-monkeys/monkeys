import useSWR from 'swr';
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite';

import { vinesFetcher } from '@/apis/fetcher';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
export const useWorkflowExecutionOutputs = (workflowId: string) =>
  useSWR<VinesWorkflowExecutionOutputListItem[] | undefined>(
    `/api/workflow/executions/${workflowId}/outputs`,
    vinesFetcher({ method: 'GET' }),
  );

export const useWorkflowExecutionAllOutputs = ({ limit = 10, page = 1 }: { limit?: number; page?: number }) =>
  useSWR<VinesWorkflowExecutionOutputListItem[] | undefined>(
    `/api/workflow/executions/all/outputs?limit=${limit}&page=${page}`,
    vinesFetcher({ method: 'GET' }),
  );

export const useInfiniteWorkflowExecutionAllOutputs = ({
  limit = 10,
}: {
  limit?: number;
}): SWRInfiniteResponse<VinesWorkflowExecutionOutputListItem[] | undefined> =>
  useSWRInfinite<VinesWorkflowExecutionOutputListItem[] | undefined>(
    (index, previousPageData) => {
      if (previousPageData && !previousPageData.length) return null;
      return `/api/workflow/executions/all/outputs?limit=${limit}&page=${index + 1}`;
    },
    vinesFetcher({ method: 'GET' }),
    {
      initialSize: 1,
    },
  );
