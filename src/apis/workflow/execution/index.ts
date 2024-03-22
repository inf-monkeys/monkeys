import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

export const executionWorkflow = (workflowId: string, inputData: Record<string, unknown>, version = 1) =>
  vinesFetcher<string>({
    method: 'POST',
    simple: true,
    wrapper: (it) => (it as unknown as { workflowInstanceId: string })?.workflowInstanceId ?? '',
  })(`/api/workflow/${workflowId}/start`, {
    inputData,
    version,
  });

export const executionWorkflowWithDebug = (
  workflowId: string,
  inputData: Record<string, unknown>,
  tasks: VinesTask[],
  version = 1,
) =>
  vinesFetcher<string>({
    method: 'POST',
    simple: true,
    wrapper: (it) => (it as unknown as { workflowInstanceId: string })?.workflowInstanceId ?? '',
  })(`/api/workflow/${workflowId}/debug`, {
    inputData,
    tasks,
    version,
  });

export const useWorkflowExecution = (instanceId: string, apikey?: string) =>
  useSWR<VinesWorkflowExecution | undefined>(
    instanceId ? `/api/workflow/${instanceId}/execution-detail` : null,
    vinesFetcher({ apikey }),
  );

export const getWorkflowExecution = (instanceId: string) =>
  vinesFetcher<VinesWorkflowExecution>({ simple: true })(`/api/workflow/${instanceId}/execution-detail`);

export const executionWorkflowTerminate = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/${instanceId}/terminate`);

export const executionWorkflowPause = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/${instanceId}/pause`);

export const executionWorkflowResume = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/${instanceId}/resume`);
