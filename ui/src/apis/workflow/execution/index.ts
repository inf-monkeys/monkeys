import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import {
  IUpdateExecutionTaskParams,
  IVinesSearchWorkflowExecutionStatExportParams,
  VinesWorkflowExecutionLists,
  VinesWorkflowExecutionStatData,
} from '@/apis/workflow/execution/typings.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { IVinesSearchWorkflowExecutionsParams } from '@/schema/workspace/workflow-execution.ts';
import { IVinesSearchWorkflowExecutionStatParams } from '@/schema/workspace/workflow-execution-stat.ts';
import FileSaver from 'file-saver';

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

export const useWorkflowExecution = (instanceId: string) =>
  useSWR<VinesWorkflowExecution | undefined>(
    instanceId ? `/api/workflow/executions/${instanceId}` : null,
    vinesFetcher(),
  );

export const getWorkflowExecution = (instanceId: string) =>
  vinesFetcher<VinesWorkflowExecution>({ simple: true })(`/api/workflow/executions/${instanceId}`);

export const executionWorkflowTerminate = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/terminate`);

export const executionWorkflowPause = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/pause`);

export const executionWorkflowResume = (instanceId: string) =>
  vinesFetcher({ method: 'POST' })(`/api/workflow/executions/${instanceId}/resume`);

export const useMutationSearchWorkflowExecutions = () =>
  useSWRMutation<VinesWorkflowExecutionLists | undefined, unknown, string, IVinesSearchWorkflowExecutionsParams>(
    `/api/workflow/executions/search`,
    vinesFetcher({ method: 'POST' }),
  );
export const useSearchWorkflowExecutions = (
  params: IVinesSearchWorkflowExecutionsParams | null,
  refreshInterval = 500,
) =>
  useSWR<VinesWorkflowExecutionLists | undefined>(
    params ? ['/api/workflow/executions/search', params] : null,
    (args) =>
      vinesFetcher<VinesWorkflowExecutionLists, IVinesSearchWorkflowExecutionsParams>({ method: 'POST', simple: true })(
        ...(args as [string, IVinesSearchWorkflowExecutionsParams]),
      ),
    { refreshInterval },
  );

export const useMutationSearchWorkflowExecutionStats = (workflowId?: string) =>
  useSWRMutation<
    VinesWorkflowExecutionStatData[] | undefined,
    unknown,
    string | null,
    IVinesSearchWorkflowExecutionStatParams
  >(
    workflowId ? `/api/workflow/statistics/${workflowId}` : null,
    vinesFetcher({
      method: 'GET',
      requestResolver: ({ rawUrl, params }) => {
        return {
          url: `${rawUrl}?${qs.stringify(params, { encode: false })}`,
        };
      },
    }),
  );
export const exportSearchWorkflowExecutionStats = async (
  workflowId: string,
  params: IVinesSearchWorkflowExecutionStatExportParams,
) =>
  vinesFetcher({
    method: 'GET',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(await r.blob(), `${workflowId}_${params.startTimestamp}-${params.endTimestamp}.csv`);
    },
  })(`/api/workflow/statistics/${workflowId}?${qs.stringify(params, { encode: false })}`);

export const useUpdateExecutionTask = (instanceId: string, taskId: string) =>
  useSWRMutation<string | undefined, unknown, string | null, IUpdateExecutionTaskParams>(
    instanceId && taskId ? `/api/workflow/${instanceId}/tasks/${taskId}` : null,
    vinesFetcher({ method: 'POST' }),
  );
