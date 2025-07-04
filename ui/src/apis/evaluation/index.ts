import { vinesFetcher } from '@/apis/fetcher';
import { vinesHeader } from '@/apis/utils';

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
  MediaAsset,
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
  // 确保 dataType 至少为 'trends'
  const finalParams = {
    dataType: 'trends',
    ...params,
  };
  const query = new URLSearchParams(finalParams as any).toString();
  return vinesFetcher<ChartDataResponse>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/chart-data?${query}`).then((result) => result as ChartDataResponse);
};

// =================================================================
// OpenSkill 评测系统 API
// =================================================================

export interface JoinEvaluationDto {
  assetIds: string[];
}

export interface OpenSkillLeaderboardItem {
  rank: number;
  assetId: string;
  rating: number; // 后端实际返回的字段名
  mu: number;
  sigma: number;
  totalBattles: number;
  lastUpdated: string;
}

export interface OpenSkillLeaderboardResponse {
  data: OpenSkillLeaderboardItem[];
  total: number;
  page: number;
  limit: number;
}

export interface EvaluationStatus {
  isComplete: boolean;
  progress: number;
  totalAssets: number;
  stableAssets: number;
  averageSigma: number;
  needsMoreBattles: string[];
}

export interface RecentBattle {
  winner: 'A' | 'B' | 'DRAW';
  assetAId: string;
  assetBId: string;
  battleId: string;
  timestamp: number;
  oldRatingA?: number;
  newRatingA?: number;
  oldRatingB?: number;
  newRatingB?: number;
}

export interface AvailableAssetsResponse {
  data: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetsInModuleResponse {
  assetIds: string[];
  total: number;
}

// 加入OpenSkill评测排行榜
export const joinEvaluation = (
  moduleId: string,
  payload: JoinEvaluationDto,
): Promise<{ success: boolean; addedCount: number; message: string }> => {
  return vinesFetcher<{ success: boolean; addedCount: number; message: string }>({
    method: 'POST',
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/join`, payload).then(
    (result) => result as { success: boolean; addedCount: number; message: string },
  );
};

// 获取排行榜中的资产列表
export const getAssetsInModule = (moduleId: string): Promise<AssetsInModuleResponse> => {
  return vinesFetcher<AssetsInModuleResponse>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/assets`).then((result) => result as AssetsInModuleResponse);
};

// 获取可加入排行榜的图片
export const getAvailableAssets = (moduleId: string, params: ListDto = {}): Promise<AvailableAssetsResponse> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<any>({
    simple: false,
    wrapper: (data, raw) => ({
      data: raw.data,
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
    }),
  })(`/api/evaluation/modules/${moduleId}/available-assets?${query}`).then(
    (result) => result as AvailableAssetsResponse,
  );
};

// 获取OpenSkill排行榜
export const getOpenSkillLeaderboard = (
  moduleId: string,
  params: ListDto = {},
): Promise<OpenSkillLeaderboardResponse> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<any>({
    // 需要完整原始响应以获得分页信息，因此不能使用 simple: true
    simple: false,
    // wrapper 直接返回原始响应，方便统一处理
    wrapper: (_data, raw) => raw,
  })(`/api/evaluation/modules/${moduleId}/leaderboard?${query}`).then((result) => {
    /*
     * 后端理想结构：
     * { code: 200, data: [...], total: 123, page: 2, limit: 10 }
     * 若后端仅返回数组，则 fallback
     */
    if (result && Array.isArray(result.data)) {
      // 带分页信息的新结构
      return {
        data: result.data,
        total: result.total ?? result.data.length,
        page: result.page ?? 1,
        limit: result.limit ?? result.data.length,
      };
    }
    if (Array.isArray(result)) {
      // 仅数组的旧结构
      return {
        data: result,
        total: result.length,
        page: 1,
        limit: result.length,
      };
    }
    // 不可预期结构，返回安全默认值
    return { data: [], total: 0, page: 1, limit: 10 };
  });
};

// 获取最近对战记录
export const getRecentBattles = (moduleId: string, limit?: number): Promise<RecentBattle[]> => {
  const params = limit ? `?limit=${limit}` : '';
  return vinesFetcher<RecentBattle[]>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/recent-battles${params}`).then((result) => result as RecentBattle[]);
};

// 获取评测完成状态
export const getEvaluationStatus = (moduleId: string): Promise<EvaluationStatus> => {
  return vinesFetcher<EvaluationStatus>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/evaluation-status`).then((result) => result as EvaluationStatus);
};

// 获取评分趋势
export const getRatingTrends = (
  moduleId: string,
  params: {
    days?: number;
    evaluatorId?: string;
    limit?: number;
    minBattles?: number;
  } = {},
): Promise<any> => {
  const query = new URLSearchParams(params as any).toString();
  return vinesFetcher<any>({
    simple: true,
  })(`/api/evaluation/modules/${moduleId}/rating-trends?${query}`).then((result) => result);
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

// =================================================================
// 导出功能 API
// =================================================================

export interface ExportHtmlOptions {
  minRating?: number;
  maxRating?: number;
  limit?: number;
  minBattles?: number;
}

export interface ExportCsvOptions {
  includeImageUrls?: boolean;
}

// 导出排行榜HTML（仅评测完成后可用）
export const exportLeaderboardHtml = (moduleId: string, options: ExportHtmlOptions = {}): Promise<void> => {
  const query = new URLSearchParams(options as any).toString();
  const url = `/api/evaluation/modules/${moduleId}/export/html?${query}`;

  // 获取认证头信息
  const headers = vinesHeader({});

  return fetch(url, {
    method: 'GET',
    headers: headers,
  }).then((response) => {
    if (!response.ok) {
      return response.text().then((text) => {
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      });
    }

    // 获取文件名（从Content-Disposition头或生成默认名称）
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename =
      contentDisposition?.match(/filename="(.+)"/)?.[1] ||
      (() => {
        const timestamp = new Date().toISOString().split('T')[0];
        const ratingRange =
          options.minRating || options.maxRating ? `_${options.minRating || 'min'}-${options.maxRating || 'max'}` : '';
        return `leaderboard-${moduleId}${ratingRange}_${timestamp}.html`;
      })();

    // 下载文件
    return response.blob().then((blob) => {
      const url_obj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_obj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_obj);
      document.body.removeChild(a);
    });
  });
};

// 导出排行榜CSV（仅评测完成后可用）
export const exportLeaderboardCsv = (moduleId: string, options: ExportCsvOptions = {}): Promise<void> => {
  const query = new URLSearchParams(options as any).toString();
  const url = `/api/evaluation/modules/${moduleId}/export/csv?${query}`;

  // 获取认证头信息
  const headers = vinesHeader({});

  return fetch(url, {
    method: 'GET',
    headers: headers,
  }).then((response) => {
    if (!response.ok) {
      return response.text().then((text) => {
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      });
    }

    // 获取文件名（从Content-Disposition头或生成默认名称）
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename =
      contentDisposition?.match(/filename="(.+)"/)?.[1] ||
      (() => {
        const timestamp = new Date().toISOString().split('T')[0];
        return `leaderboard-complete-${moduleId}_${timestamp}.csv`;
      })();

    // 下载文件
    return response.blob().then((blob) => {
      const url_obj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_obj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_obj);
      document.body.removeChild(a);
    });
  });
};
