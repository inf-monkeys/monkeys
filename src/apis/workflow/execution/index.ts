import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IUpdateExecutionTaskParams, VinesWorkflowExecutionLists } from '@/apis/workflow/execution/typings.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { IVinesSearchWorkflowExecutionsParams } from '@/schema/workspace/workflow-execution.ts';

export const executionWorkflow = (workflowId: string, inputData: Record<string, unknown>, version = 1) =>
  vinesFetcher<string>({
    method: 'POST',
    simple: true,
    wrapper: (it) => (it as unknown as { workflowInstanceId: string })?.workflowInstanceId ?? '',
  })(`/api/workflow/executions/${workflowId}/start`, {
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
  })(`/api/workflow/executions/${workflowId}/debug`, {
    inputData,
    tasks,
    version,
  });

export const useWorkflowExecution = (instanceId: string, apikey?: string) =>
  useSWR<VinesWorkflowExecution | undefined>(
    instanceId ? `/api/workflow/executions/${instanceId}/execution-detail` : null,
    vinesFetcher({ apikey }),
  );

export const getWorkflowExecution = (instanceId: string) =>
  vinesFetcher<VinesWorkflowExecution>({ simple: true })(`/api/workflow/executions/${instanceId}/execution-detail`);

export const executionWorkflowTerminate = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/terminate`);

export const executionWorkflowPause = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/pause`);

export const executionWorkflowResume = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/resume`);

export const useSearchWorkflowExecutions = () =>
  useSWRMutation<VinesWorkflowExecutionLists | undefined, unknown, string, IVinesSearchWorkflowExecutionsParams>(
    `/api/workflow/executions/search`,
    vinesFetcher({ method: 'POST' }),
  );

export const useUpdateExecutionTask = (instanceId: string, taskId: string) =>
  useSWRMutation<string | undefined, unknown, string | null, IUpdateExecutionTaskParams>(
    instanceId && taskId ? `/api/workflow/${instanceId}/tasks/${taskId}` : null,
    vinesFetcher({ method: 'POST' }),
  );
