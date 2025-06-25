/**
 * =================================================================
 * 通用类型定义
 * =================================================================
 */

// 通用列表查询参数
export interface ListDto {
  page?: number;
  limit?: number;
  search?: string;
}

// 媒体资源（如图片）的核心数据结构
export interface MediaAsset {
  assetType: string;
  id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  teamId: string;
  creatorUserId: string;
  iconUrl: string;
  displayName: string;
  description: string;
  isPreset: boolean;
  isPublished: boolean;
  publishConfig: any;
  type: string;
  url: string;
  source: string;
  size: number;
  params: any;
  md5: string;
  user: {
    id: string;
    photo: string;
    name: string;
    email: string;
    phone: string | null;
    nickname: string | null;
  };
  team: {
    id: string;
    createdTimestamp: number;
    updatedTimestamp: number;
    isDeleted: boolean;
    name: string;
    description: string;
    iconUrl: string;
    darkmodeIconUrl: string | null;
    ownerUserId: string;
    isBuiltIn: boolean;
    isPublic: boolean;
    workflowTaskNamePrefix: string;
    customTheme: any;
    enableJoinRequest: boolean;
  };
  assetTags: any[];
}

/**
 * =================================================================
 * 评测模块 (Module) 相关类型
 * =================================================================
 */

// Glicko 配置（可选）
export interface GlickoConfig {
  tau?: number;
  rating?: number;
  rd?: number;
  vol?: number;
}

// 评测模块的核心数据结构
export interface EvaluationModule {
  id: string;
  displayName: string;
  description?: string;
  evaluationCriteria?: string;
  glickoConfig?: GlickoConfig;
  participantAssetIds?: string[];
  createdAt: string;
  updatedAt: string;
  createdTimestamp?: number;
  updatedTimestamp?: number;
  isActive?: boolean;
}

// 创建评测模块的请求体
export interface CreateEvaluationModuleDto {
  displayName: string;
  description?: string;
  evaluationCriteria?: string;
  participantAssetIds?: string[];
  glickoConfig?: GlickoConfig;
}

// 向模块添加参与者的请求体
export interface AddParticipantsDto {
  assetIds: string[];
}

/**
 * =================================================================
 * 评测员 (Evaluator) 相关类型
 * =================================================================
 */

// 评测员的核心数据结构
export interface Evaluator {
  id: string;
  name: string;
  type: 'llm' | 'human';
  llmModelName?: string;
  evaluationFocus?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建评测员的请求体
export interface CreateEvaluatorDto {
  name: string;
  type: 'llm' | 'human'; // 'human' 类型是根据上下文推断，您可以根据实际情况调整
  llmModelName?: string;
  evaluationFocus?: string;
}

// 将评测员添加到模块的请求体
export interface AddEvaluatorToModuleDto {
  evaluatorId: string;
  weight?: number;
}

/**
 * =================================================================
 * 对战 (Battle) 与结果相关类型
 * =================================================================
 */

// 对战策略
export type BattleStrategy = 'ROUND_ROBIN' | 'RANDOM_PAIRS';

// 对战结果
export type BattleResult = 'A_WIN' | 'B_WIN' | 'DRAW' | 'CANCELLED';

// 创建单场对战的请求体
export interface CreateBattleDto {
  assetAId: string;
  assetBId: string;
}

// 创建批量对战组的请求体
export interface CreateBattleGroupDto {
  assetIds: string[];
  strategy: BattleStrategy;
  battleCount?: number; // 仅在 RANDOM_PAIRS 策略下需要
  description?: string;
}

// 提交对战结果的请求体
export interface SubmitBattleResultDto {
  result: BattleResult;
  reason?: string; // 可选的评判理由
}

// 单场对战的详细信息
export interface Battle {
  id: string;
  assetAId: string;
  assetBId: string;
  assetA?: MediaAsset;
  assetB?: MediaAsset;
  result: BattleResult;
  reason?: string;
  evaluatorId?: string;
  createdAt: string;
}

/**
 * =================================================================
 * 异步任务 (Task) 与进度相关类型
 * =================================================================
 */

// 任务状态
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 评测任务的核心数据结构
export interface EvaluationTask {
  id: string;
  status: TaskStatus;
  progress?: TaskProgress;
  result?: any;
  battleGroupId?: string;
  battles?: Battle[]; // 包含该任务下的所有对战详情
  // ... 其他任务元数据
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// SSE 进度更新数据结构
export interface TaskProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  current: string;
}

// SSE 事件流的完整数据包
export interface SSEData {
  task: EvaluationTask;
  progress: TaskProgress;
  timestamp: string;
}

/**
 * =================================================================
 * 排行榜 (Leaderboard) 与统计相关类型
 * =================================================================
 */

// ELO 排行榜条目
export interface EloLeaderboardEntry {
  rank: number;
  asset: {
    name: string;
    type: string;
  };
  totalBattles: number;
  wins: string;
  losses: string;
  draws: string;
  winRate: number;
  rating?: number;
}

export interface EloLeaderboardResponse {
  items: EloLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  module: {
    id: string;
    name: string;
    description: string | null;
    totalParticipants: number;
    totalBattles: number;
  };
  stats: {
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    mostActiveBattler: {
      battleCount: number | null;
    };
    lastUpdated: string;
  };
}

// ELO 统计信息
export interface RatingDistribution {
  min: number;
  max: number | null;
  label: string;
  count: number;
}

export interface TopPerformer {
  rank: number;
  asset: {
    name: string;
    type: string;
  };
  totalBattles: number;
  wins: string;
  losses: string;
  draws: string;
  winRate: number;
}

export interface RecentChangeAsset {
  id: string;
  name: string;
  oldRating: number;
  newRating: number;
  change: number;
}

export interface RecentChange {
  battleId: string;
  date: string;
  assetA: RecentChangeAsset;
  assetB: RecentChangeAsset;
  result: string;
  winner: string;
  evaluator: string;
}

export interface EloStats {
  overview: {
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    mostActiveBattler: {
      battleCount: number | null;
    };
    lastUpdated: string;
  };
  ratingDistribution: RatingDistribution[];
  topPerformers: TopPerformer[];
  recentChanges: RecentChange[];
  totalParticipants: number;
}

// 单个资产的评分历史条目
export interface RatingHistoryEntry {
  battleId: string;
  opponentAssetId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  result: BattleResult;
  timestamp: string;
}

// 图表数据查询参数
export interface GetChartDataDto {
  evaluatorId?: string;
  days?: number;
  dataType?: string;
}

export interface ChartDataPoint {
  date: string;
  rating: number;
  battleId: string;
}

export interface ChartDataTrend {
  assetId: string;
  assetName: string;
  points: ChartDataPoint[];
  currentRating: number;
  startRating: number;
  maxRating: number;
  minRating: number;
  ratingChange: number;
  totalBattles: number;
  winRate: number;
  volatility: number;
}

export interface ChartDataSummary {
  totalAssets: number;
  totalBattles: number;
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  mostImproved: ChartDataTrend;
  mostActive: ChartDataTrend;
}

export interface ChartDataResponse {
  moduleId: string;
  period: {
    days: number;
    start: string;
    end: string;
  };
  type: string;
  data: {
    trends: {
      trends: ChartDataTrend[];
      period: {
        start: string;
        end: string;
        days: number;
      };
      summary: ChartDataSummary;
    };
  };
}

// 排行榜查询参数
export interface GetEloLeaderboardDto extends ListDto {
  sortBy?: 'rating' | 'wins' | 'totalMatches';
  sortOrder?: 'asc' | 'desc';
}
