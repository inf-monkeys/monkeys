import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IValidateWorkflowParams, IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';

export const useWorkflowValidation = (workflowId: string, version = 1) =>
  useSWR<IWorkflowValidation | undefined>(
    workflowId && version ? `/api/workflow/metadata/${workflowId}/validation-issues?version=${version}` : null,
    vinesFetcher(),
  );

export const useWorkflowValidate = () =>
  useSWRMutation<IWorkflowValidation | undefined, unknown, string, IValidateWorkflowParams>(
    '/api/workflow/validate',
    vinesFetcher({ method: 'POST' }),
  );
