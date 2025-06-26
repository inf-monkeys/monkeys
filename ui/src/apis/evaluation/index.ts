import { vinesFetcher } from '@/apis/fetcher';

import {
  AddEvaluatorToModuleDto,
  AddParticipantsDto,
  Battle,
  ChartDataResponse,
  CreateBattleDto,
  CreateBattleGroupDto,
  CreateEvaluationModuleDto,
  CreateEvaluatorDto,
  EloLeaderboardResponse,
  EloStats,
  EvaluationModule,
  EvaluationTask,
  Evaluator,
  GetChartDataDto,
  GetEloLeaderboardDto,
  ListDto,
  RatingHistoryEntry,
  SubmitBattleResultDto,
} from './typings';

// =================================================================
// 评测模块管理 API
// =================================================================

export const createEvaluationModule = (payload: CreateEvaluationModuleDto): Promise<EvaluationModule> => {
  return vinesFetcher<EvaluationModule>({
    method: 'POST',
    simple: true,
  })('/api/evaluation/modules', payload).then((result) => result as EvaluationModule);
};

export const getEvaluationModules = (params: ListDto = {}): Promise<{ data: EvaluationModule[]; total: number }> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<{ data: EvaluationModule[]; total: number }>({
    simple: true,
  })(`/api/evaluation/modules?${query}`).then((result) => result || { data: [], total: 0 });
};

export const getModuleDetails = (moduleId: string): Promise<EvaluationModule> => {
  return vinesFetcher<EvaluationModule>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}`).then((result) => result as EvaluationModule);
};

export const deleteEvaluationModule = (moduleId: string): Promise<void> => {
  return vinesFetcher<void>({
    method: 'DELETE',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}`);
};

export const addParticipantsToModule = (moduleId: string, payload: AddParticipantsDto): Promise<void> => {
  return vinesFetcher<void>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/participants`, payload);
};

// =================================================================
// 评测员管理 API
// =================================================================

export const createEvaluator = (payload: CreateEvaluatorDto): Promise<Evaluator> => {
  return vinesFetcher<Evaluator>({
    method: 'POST',
    simple: true,
  })('/api/evaluation/evaluators', payload).then((result) => result as Evaluator);
};

export const getEvaluators = (params: ListDto = {}): Promise<{ data: Evaluator[]; total: number }> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<{ data: Evaluator[]; total: number }>({
    simple: true,
  })(`/api/evaluation/evaluators?${query}`).then((result) => result || { data: [], total: 0 });
};

export const getEvaluatorDetails = (evaluatorId: string): Promise<Evaluator> => {
  return vinesFetcher<Evaluator>({
    simple: true,
  })(`/api/evaluation/evaluators/${evaluatorId}`).then((result) => result as Evaluator);
};

export const getModuleEvaluators = (
  moduleId: string,
  params: ListDto = {},
): Promise<{ data: Evaluator[]; total: number }> => {
  const finalParams = {
    page: 1,
    limit: 100,
    ...params,
  };
  const query = new URLSearchParams(finalParams as any).toString();
  return vinesFetcher<Evaluator[]>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/evaluators?${query}`).then((result) => {
    if (Array.isArray(result)) {
      return { data: result, total: result.length };
    }
    return { data: [], total: 0 };
  });
};

export const addEvaluatorToModule = (moduleId: string, payload: AddEvaluatorToModuleDto): Promise<void> => {
  return vinesFetcher<void>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/evaluators`, payload);
};

// =================================================================
// 对战与结果管理 API
// =================================================================

export const createSingleBattle = (moduleId: string, payload: CreateBattleDto): Promise<any> => {
  return vinesFetcher<any>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/battles`, payload).then((result) => result || {});
};

export const createBattleGroup = (moduleId: string, payload: CreateBattleGroupDto): Promise<any> => {
  return vinesFetcher<any>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/battle-groups`, payload);
};

export const submitBattleResult = (battleId: string, payload: SubmitBattleResultDto): Promise<void> => {
  return vinesFetcher<void>({
    method: 'PUT',
    simple: true,
  })(`/api/evaluation/battles/${battleId}/result`, payload);
};

export const startAutoEvaluation = (battleGroupId: string): Promise<{ taskId: string }> => {
  return vinesFetcher<{ taskId: string }>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/battle-groups/${battleGroupId}/auto-evaluate`).then((result) => result as { taskId: string });
};

// =================================================================
// 异步任务与进度 API
// =================================================================

export const getUserTasks = (params: ListDto = {}): Promise<{ data: EvaluationTask[]; total: number }> => {
  const finalParams = {
    page: 1,
    limit: 10,
    ...params,
  };
  const query = new URLSearchParams(finalParams as any).toString();
  return vinesFetcher<EvaluationTask[]>({
    simple: true,
  })(`/api/evaluation/tasks?${query}`).then((result) => {
    if (Array.isArray(result)) {
      return { data: result, total: result.length };
    }
    return { data: [], total: 0 };
  });
};

export const getTaskDetails = (taskId: string): Promise<EvaluationTask> => {
  return vinesFetcher<EvaluationTask>({
    simple: true,
  })(`/api/evaluation/tasks/${taskId}`).then((result) => result as EvaluationTask);
};

export const getTaskResults = (taskId: string, params: ListDto = {}): Promise<{ data: Battle[]; total: number }> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<{ data: Battle[]; total: number }>({
    simple: true,
  })(`/api/evaluation/tasks/${taskId}/results?${query}`).then((result) => result || { data: [], total: 0 });
};

export const cancelTask = (taskId: string): Promise<void> => {
  return vinesFetcher<void>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/tasks/${taskId}/cancel`);
};

/**
 * 订阅任务进度 (SSE - Server-Sent Events)
 * @param taskId - 要订阅的任务 ID
 * @param onMessage - 接收到消息时的回调函数
 * @param onError - 发生错误时的回调函数
 * @returns 返回一个可以用来关闭连接的 EventSource 实例
 */
export const subscribeToTaskProgress = (
  taskId: string,
  onMessage: (data: any) => void,
  onError: (event: Event) => void,
): EventSource => {
  const eventSource = new EventSource(`/api/evaluation/sse/tasks/${taskId}/progress`);

  eventSource.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);
    onMessage(parsedData.data); // 根据后端文档，真实数据在 `data` 字段中
  };

  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    onError(error);
    eventSource.close(); // 发生错误时通常需要关闭连接
  };

  return eventSource;
};

// =================================================================
// 排行榜与统计 API
// =================================================================

export const getEloLeaderboard = (
  moduleId: string,
  params: GetEloLeaderboardDto = {},
): Promise<EloLeaderboardResponse> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<EloLeaderboardResponse>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/elo-leaderboard?${query}`).then((result) => {
    if (result) {
      return result;
    }
    // Return a default structure that matches EloLeaderboardResponse
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      module: {} as any,
      stats: {} as any,
    };
  });
};

export const getEloStats = (moduleId: string): Promise<EloStats> => {
  return vinesFetcher<EloStats>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/elo-stats`).then((result) => result as EloStats);
};

export const getAssetRatingHistory = (
  assetId: string,
  moduleId: string,
  limit?: number,
): Promise<RatingHistoryEntry[]> => {
  const params: { moduleId: string; limit?: string } = { moduleId };
  if (limit) {
    params.limit = String(limit);
  }
  const query = new URLSearchParams(params).toString();
  return vinesFetcher<RatingHistoryEntry[]>({
    simple: true,
  })(`/api/evaluation/assets/${assetId}/rating-history?${query}`).then((result) => result || []);
};

export const getChartData = (moduleId: string, params: GetChartDataDto): Promise<ChartDataResponse> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<ChartDataResponse>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/chart-data?${query}`).then((result) => result as ChartDataResponse);
};

export interface UpdateEvaluationModuleDto {
  displayName?: string;
  description?: string;
  evaluationCriteria?: string;
  isActive?: boolean;
  glickoConfig?: {
    rating?: number;
    rd?: number;
    tau?: number;
    vol?: number;
  };
}

export const updateEvaluationModule = (
  moduleId: string,
  payload: UpdateEvaluationModuleDto,
): Promise<EvaluationModule> => {
  return vinesFetcher<EvaluationModule>({
    method: 'PUT',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}`, payload).then((result) => result as EvaluationModule);
};
