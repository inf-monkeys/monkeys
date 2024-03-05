import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPageType } from '@/apis/pages/typings.ts';

export const useListWorkspacePages = (workflowId: string) =>
  useSWR<IPageType[]>(workflowId ? `/api/workflow/${workflowId}/pages` : null, vinesFetcher());
