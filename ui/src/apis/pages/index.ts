import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { CreatePageDto, IPageGroup, IPageInstance, IPageType, IPinningPage } from '@/apis/pages/typings.ts';

export const useWorkspacePages = () => useSWR<IPinningPage | undefined>('/api/workflow/pages/pinned', vinesFetcher());

export const useWorkspacePagesWithWorkflowId = (workflowId: string) =>
  useSWR<IPageType[] | undefined>(workflowId ? `/api/workflow/${workflowId}/pages` : null, vinesFetcher());

export const updateWorkspacePages = (workflowId: string, pages: (Partial<IPageType> & { pageId: string })[]) =>
  vinesFetcher<IPageType[]>({ method: 'PUT', simple: true })(`/api/workflow/${workflowId}/pages`, {
    pages,
  });

export const useWorkspacePageInstances = () =>
  useSWR<IPageInstance[] | undefined>('/api/workflow/pages/types', vinesFetcher(), {
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
    `/api/workflow/pages/${pageId}/pin`,
    {
      pin,
    },
  );

export const usePageGroups = () => useSWR<IPageGroup[] | undefined>('/api/workflow/page-groups', vinesFetcher());

export const useCreatePageGroup = () =>
  useSWRMutation<IPageGroup[] | undefined, unknown, string, { displayName: string; pageId?: string }>(
    '/api/workflow/page-groups',
    vinesFetcher({ method: 'POST' }),
  );

export const useDeletePageGroup = (groupId: string) =>
  useSWRMutation<IPageGroup[] | undefined, unknown, string | null>(
    groupId ? `/api/workflow/page-groups/${groupId}` : null,
    vinesFetcher({ method: 'DELETE' }),
  );

export interface IUpdatePageGroupParams {
  displayName?: string;
  pageId?: string;
  mode?: 'add' | 'remove';
}

export const useUpdateGroupPages = (groupId?: string) =>
  useSWRMutation<IPageGroup[] | undefined, unknown, string | null, IUpdatePageGroupParams>(
    groupId ? `/api/workflow/page-groups/${groupId}` : null,
    vinesFetcher({ method: 'PUT' }),
  );
