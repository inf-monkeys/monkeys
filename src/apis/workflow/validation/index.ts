import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IWorkflowValidation } from '@/apis/workflow/validation/typings.ts';

export const useWorkflowValidation = (workflowId: string, version = 1) =>
  useSWR<IWorkflowValidation | undefined>(
    workflowId && version ? `/api/workflow/${workflowId}/validation-issues?version=${version}` : null,
    vinesFetcher(),
  );
