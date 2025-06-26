import { create } from 'zustand';

import {
  createBattleGroup,
  getEloLeaderboard,
  getEvaluationModules,
  getModuleDetails,
  startAutoEvaluation,
  subscribeToTaskProgress,
} from '@/apis/evaluation';
import { EloLeaderboardEntry, EvaluationModule, TaskProgress } from '@/apis/evaluation/typings';

interface EvaluationState {
  modules: EvaluationModule[];
  loading: boolean;
  fetchModules: () => Promise<void>;

  currentModule: EvaluationModule | null;
  fetchModuleDetails: (moduleId: string) => Promise<void>;

  leaderboard: EloLeaderboardEntry[];
  fetchLeaderboard: (moduleId: string) => Promise<void>;

  taskProgress: TaskProgress | null;
  isEvaluating: boolean;
  runAutoEvaluation: (
    moduleId: string,
    assetIds: string[],
    strategy: 'RANDOM_PAIRS' | 'ROUND_ROBIN',
    battleCount?: number,
  ) => Promise<void>;
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  modules: [],
  loading: false,
  fetchModules: async () => {
    set({ loading: true });
    const { data } = await getEvaluationModules({ limit: 100 }); // 简单处理，未分页
    set({ modules: data, loading: false });
  },

  currentModule: null,
  fetchModuleDetails: async (moduleId: string) => {
    const module = await getModuleDetails(moduleId);
    set({ currentModule: module });
  },

  leaderboard: [],
  fetchLeaderboard: async (moduleId: string) => {
    set({ loading: true });
    const { items } = await getEloLeaderboard(moduleId);
    set({ leaderboard: items, loading: false });
  },

  taskProgress: null,
  isEvaluating: false,
  runAutoEvaluation: async (moduleId, assetIds, strategy, battleCount) => {
    set({
      isEvaluating: true,
      taskProgress: { total: 0, completed: 0, failed: 0, percentage: 0, current: '创建对战组...' },
    });

    // 1. 创建对战组
    const { battleGroupId } = await createBattleGroup(moduleId, {
      assetIds,
      strategy,
      battleCount,
    });

    // 2. 启动自动评测
    const { taskId } = await startAutoEvaluation(battleGroupId);
    set((state) => ({ taskProgress: { ...state.taskProgress!, current: '任务已启动，等待评测...' } }));

    // 3. 监听 SSE 进度
    const sse = subscribeToTaskProgress(
      taskId,
      (progressData) => {
        set({ taskProgress: progressData.progress });
      },
      () => {
        set({ isEvaluating: false });
        get().fetchLeaderboard(moduleId); // 结束后自动刷新排行榜
        sse.close();
      },
    );
  },
}));
