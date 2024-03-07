import useSWR from 'swr';

import { CreatePageDto } from '@inf-monkeys/vines';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPageInstance, IPageType, IPinPage } from '@/apis/pages/typings.ts';

export const useWorkspacePages = () => useSWR<IPinPage[] | undefined>('/api/pages', vinesFetcher());

export const useWorkspacePagesWithWorkflowId = (workflowId: string) =>
  useSWR<IPageType[] | undefined>(workflowId ? `/api/workflow/${workflowId}/pages` : null, vinesFetcher());

export const updateWorkspacePages = (
  apikey: string,
  workflowId: string,
  pages: (Partial<IPageType> & { pageId: string })[],
) =>
  vinesFetcher<IPageType[]>({ method: 'PUT', apikey, simple: true })(`/api/workflow/${workflowId}/pages`, {
    pages,
  });

export const useWorkspacePageInstances = () =>
  useSWR<IPageInstance[] | undefined>('/api/page-types', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const createWorkspacePage = (workflowId: string, page: Partial<CreatePageDto>) =>
  vinesFetcher<IPageType[], Partial<CreatePageDto>>({ method: 'POST', simple: true })(
    `/api/workflow/${workflowId}/pages`,
    page,
  );

export const deleteWorkspacePage = (workflowId: string, pageId: string) =>
  vinesFetcher<IPageType[], string>({ method: 'DELETE', simple: true })(`/api/workflow/${workflowId}/pages/${pageId}`);

export const toggleWorkspacePagePin = (pageId: string, pin: boolean) =>
  vinesFetcher<Omit<IPageType, 'instance'>, { pin: boolean }>({ method: 'POST', simple: true })(
    `/api/pages/${pageId}/pin`,
    {
      pin,
    },
  );
