import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';

export const useWorkflowInstanceByArtifactUrl = (url?: string | null) =>
  useSWR<VinesWorkflowExecutionOutputListItem | undefined>(
    url ? ['/api/workflow/artifact/getInstanceByUrl', { url }] : null,
    vinesFetcher<VinesWorkflowExecutionOutputListItem, string>({ method: 'POST', simple: true }),
  );
