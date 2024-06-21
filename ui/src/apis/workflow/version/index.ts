import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IWorkflowValidationIssue } from '@/apis/workflow/validation/typings.ts';

export const useWorkflowVersions = (workflowId: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(
    workflowId ? `/api/workflow/metadata/${workflowId}/versions` : null,
    vinesFetcher({ wrapper: (data) => data?.reverse() }),
  );

export const useCreateWorkflowRelease = (workflowId: string) =>
  useSWRMutation<
    { validationIssues: IWorkflowValidationIssue[]; workflowId: string } | undefined,
    unknown,
    string | null,
    Partial<MonkeyWorkflow>
  >(workflowId ? `/api/workflow/metadata/${workflowId}/versions` : null, vinesFetcher({ method: 'POST' }));
