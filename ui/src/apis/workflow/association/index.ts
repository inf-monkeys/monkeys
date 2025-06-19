import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher';

import { IUpdateAndCreateWorkflowAssociation, IWorkflowAssociation } from './typings';

export const useWorkflowAssociationList = (workflowId?: string | null) =>
  useSWR<IWorkflowAssociation[] | undefined>(
    workflowId ? `/api/workflow/${workflowId}/associations` : null,
    vinesFetcher(),
  );

export const createWorkflowAssociation = (workflowId: string, association: IUpdateAndCreateWorkflowAssociation) =>
  vinesFetcher<IWorkflowAssociation, IUpdateAndCreateWorkflowAssociation>({ method: 'POST', simple: true })(
    `/api/workflow/${workflowId}/associations`,
    association,
  );

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
