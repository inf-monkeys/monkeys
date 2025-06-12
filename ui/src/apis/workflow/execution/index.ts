import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import useSWRMutation from 'swr/mutation';

import FileSaver from 'file-saver';
import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import {
  IUpdateExecutionTaskParams,
  IVinesSearchWorkflowExecutionStatExportParams,
  VinesWorkflowExecutionLists,
  VinesWorkflowExecutionStatData,
} from '@/apis/workflow/execution/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution, VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';
import { IVinesSearchWorkflowExecutionsParams } from '@/schema/workspace/workflow-execution.ts';
import { IVinesSearchWorkflowExecutionStatParams } from '@/schema/workspace/workflow-execution-stat.ts';

export const executionWorkflow = (
  workflowId: string,
  inputData: Record<string, unknown>,
  version = 1,
  chatSessionId?: string,
) =>
  vinesFetcher<string>({
    method: 'POST',
    simple: true,
    wrapper: (it) => (it as unknown as { workflowInstanceId: string })?.workflowInstanceId ?? '',
  })(`/api/workflow/executions/${workflowId}/start`, {
    inputData,
    version,
    ...(chatSessionId && { chatSessionId }),
  });

export const executionWorkflowWithDebug = (
  workflowId: string,
  inputData: Record<string, unknown>,
  tasks: VinesTask[],
) =>
  vinesFetcher<string>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/executions/${workflowId}/debug`, {
    inputData,
    tasks,
  });

export const useWorkflowExecution = (instanceId: string) =>
  useSWR<VinesWorkflowExecution | undefined>(
    instanceId ? `/api/workflow/executions/${instanceId}` : null,
    vinesFetcher(),
  );

export const getWorkflowExecution = (instanceId: string) =>
  vinesFetcher<VinesWorkflowExecution>({ simple: true })(`/api/workflow/executions/${instanceId}`);

export const deleteWorkflowExecution = (instanceId: string) =>
  vinesFetcher({ method: 'DELETE' })(`/api/workflow/executions/${instanceId}`);

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

export const useWorkflowExecutionList = (workflowId?: string | null, page = 1, limit = 20, refreshInterval = 500) =>
  useSWR<IPaginationListData<VinesWorkflowExecutionOutputListItem> | undefined>(
    workflowId ? `/api/workflow/executions/${workflowId}/outputs?${qs.stringify({ page, limit })}` : null,
    vinesFetcher({ method: 'GET', wrapper: paginationWrapper }),
    { refreshInterval },
  );

export const useWorkflowExecutionListInfinite = (workflowId?: string | null, limit = 20) =>
  useSWRInfinite<IPaginationListData<VinesWorkflowExecutionOutputListItem> | undefined>(
    (index, previousPageData) => {
      // 如果已经到达最后一页，返回 null 停止请求
      if (previousPageData && !previousPageData.data.length) {
        return null;
      }

      // 构建分页参数
      const page = index + 1;
      return workflowId ? `/api/workflow/executions/${workflowId}/outputs?${qs.stringify({ page, limit })}` : null;
    },
    vinesFetcher({ method: 'GET', wrapper: paginationWrapper }),
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    },
  );

export const useMutationSearchWorkflowExecutionStats = ({
  workflowId,
  isTeam = false,
}: {
  workflowId?: string;
  isTeam?: boolean;
}) =>
  useSWRMutation<
    VinesWorkflowExecutionStatData[] | undefined,
    unknown,
    string | null,
    IVinesSearchWorkflowExecutionStatParams
  >(
    workflowId && !isTeam ? `/api/workflow/statistics/${workflowId}` : isTeam ? `/api/workflow/statistics` : null,
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
  {
    workflowId,
    isTeam = false,
  }: {
    workflowId?: string;
    isTeam?: boolean;
  },
  params: IVinesSearchWorkflowExecutionStatExportParams,
) =>
  vinesFetcher({
    method: 'GET',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(
        await r.blob(),
        `${isTeam ? '' : workflowId + '_'}${params.startTimestamp}-${params.endTimestamp}.csv`,
      );
    },
  })(
    isTeam
      ? `/api/workflow/statistics?${qs.stringify(params, { encode: false })}`
      : `/api/workflow/statistics/${workflowId}?${qs.stringify(params, { encode: false })}`,
  );

export const useMutationAgentExecutionStats = ({ agentId, isTeam = false }: { agentId?: string; isTeam?: boolean }) =>
  useSWRMutation<
    VinesWorkflowExecutionStatData[] | undefined,
    unknown,
    string | null,
    IVinesSearchWorkflowExecutionStatParams
  >(
    isTeam ? `/api/conversation-apps/statistics` : agentId ? `/api/conversation-apps/${agentId}/statistics` : null,
    vinesFetcher({
      method: 'GET',
      requestResolver: ({ rawUrl, params }) => {
        return {
          url: `${rawUrl}?${qs.stringify(params, { encode: false })}`,
        };
      },
    }),
  );

export const exportAgentExecutionStats = async (
  {
    agentId,
    isTeam = false,
  }: {
    agentId?: string;
    isTeam?: boolean;
  },
  params: IVinesSearchWorkflowExecutionStatExportParams,
) =>
  vinesFetcher({
    method: 'GET',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(
        await r.blob(),
        `${isTeam ? '' : agentId + '_'}${params.startTimestamp}-${params.endTimestamp}.csv`,
      );
    },
  })(
    isTeam
      ? `/api/conversation-apps/statistics?${qs.stringify(params, { encode: false })}`
      : `/api/conversation-apps/${agentId}/statistics?${qs.stringify(params, { encode: false })}`,
  );

export const useUpdateExecutionTask = (instanceId: string, taskId: string) =>
  useSWRMutation<string | undefined, unknown, string | null, IUpdateExecutionTaskParams>(
    instanceId && taskId ? `/api/workflow/executions/${instanceId}/tasks/${taskId}` : null,
    vinesFetcher({ method: 'POST' }),
  );

export const useWorkflowExecutionThumbnails = (workflowId?: string | null) =>
  useSWR<string[] | undefined, unknown, string | null>(
    workflowId ? `/api/workflow/executions/${workflowId}/thumbnails` : null,
    vinesFetcher({ method: 'GET' }),
  );

export type TWorkflowInstanceByImageUrl = {
  instance: (Omit<VinesWorkflowExecutionOutputListItem, 'rawOutput' | 'taskId'> & { instanceId: string }) | null;
  total: number;
};

export const useWorkflowInstanceByImageUrl = (workflowId?: string | null) =>
  useSWRMutation<
    TWorkflowInstanceByImageUrl | undefined,
    unknown,
    string | null,
    { imageUrl: string; page?: number; limit?: number }
  >(
    workflowId ? `/api/workflow/executions/${workflowId}/get-instance-by-image-url` : null,
    vinesFetcher({ method: 'POST' }),
  );
