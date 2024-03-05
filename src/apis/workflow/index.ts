import useSWR from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useGetWorkflow = (apikey: string, workflowId: string) =>
  useSWR<MonkeyWorkflow>(workflowId ? `/api/workflow/${workflowId}` : null, vinesFetcher({ apikey }));
