import useSWR from 'swr';

import { vinesFetcher } from '../fetcher';
import { TemporaryWorkflow, TemporaryWorkflowInstance } from './typings';

export const useGetTemporaryWorkflow = (temporaryId?: string) =>
  useSWR<TemporaryWorkflow | undefined>(temporaryId ? `/api/temporary-workflow/${temporaryId}` : null, vinesFetcher());

export const getTemporaryWorkflow = (temporaryId: string) =>
  vinesFetcher<TemporaryWorkflow>({ method: 'GET', simple: true })(`/api/temporary-workflow/${temporaryId}`);

export const executeTemporaryWorkflow = (temporaryId: string, inputData: Record<string, any>) =>
  vinesFetcher<{ workflowInstanceId: string }>({ method: 'POST', simple: true })(
    `/api/temporary-workflow/${temporaryId}/execute`,
    { inputData },
  );

export const useTemporaryWorkflowResult = (temporaryId?: string | null, refreshInterval = 2000) =>
  useSWR<TemporaryWorkflowInstance | undefined>(
    temporaryId ? `/api/temporary-workflow/${temporaryId}/result` : null,
    vinesFetcher({ method: 'GET' }),
    { refreshInterval },
  );
