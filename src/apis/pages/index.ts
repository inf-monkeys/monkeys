import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPageType } from '@/apis/pages/typings.ts';

export const useListWorkspacePages = (workflowId: string) =>
  useSWR<IPageType[]>(workflowId ? `/api/workflow/${workflowId}/pages` : null, vinesFetcher());

export const updateWorkspacePages = (
  apikey: string,
  workflowId: string,
  pages: (Partial<IPageType> & { pageId: string })[],
) => vinesFetcher({ method: 'PUT', apikey, simple: true })(`/api/workflow/${workflowId}/pages`, { pages });
