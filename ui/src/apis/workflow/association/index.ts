import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher';

import { IWorkflowAssociation } from './typings';

export const useWorkflowAssociationList = (workflowId?: string) =>
  useSWR<IWorkflowAssociation[] | undefined>(
    workflowId ? `/api/workflow/${workflowId}/associations` : null,
    vinesFetcher(),
  );

export const createWorkflowAssociation = (
  workflowId: string,
  association: Pick<
    IWorkflowAssociation,
    'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex'
  >,
) =>
  vinesFetcher<
    IWorkflowAssociation,
    Pick<
      IWorkflowAssociation,
      'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex'
    >
  >({ method: 'POST', simple: true })(`/api/workflow/${workflowId}/associations`, association);

export const updateWorkflowAssociation = (
  workflowId: string,
  associationId: string,
  association: Partial<IWorkflowAssociation>,
) =>
  vinesFetcher<IWorkflowAssociation, Partial<IWorkflowAssociation>>({ method: 'PUT', simple: true })(
    `/api/workflow/${workflowId}/associations/${associationId}`,
    association,
  );

export const deleteWorkflowAssociation = (workflowId: string, associationId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/workflow/${workflowId}/associations/${associationId}`);
