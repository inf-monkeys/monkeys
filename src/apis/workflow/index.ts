import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useGetWorkflow = (apikey: string, workflowId: string) =>
  useSWR(workflowId ? `/api/workflows/${workflowId}` : null, vinesFetcher({}));
