import { create } from 'zustand';

interface TeamStatusStoreState {
  // 每个 teamId 对应的刷新时间戳（用于触发特定 teamId 的 hook）
  refreshTriggers: Record<string, number>;

  // 刷新特定 teamId 的状态
  refreshTeamStatus: (teamId: string) => void;

  // 刷新所有 team 状态
  refreshAllTeamStatus: () => void;
}

export const useTeamStatusStore = create<TeamStatusStoreState>((set) => ({
  refreshTriggers: {},

  refreshTeamStatus: (teamId: string) => {
    // 更新该 teamId 的刷新时间戳，只有监听这个 teamId 的 hook 会被触发
    set((state) => ({
      refreshTriggers: {
        ...state.refreshTriggers,
        [teamId]: Date.now(),
      },
    }));
  },

  refreshAllTeamStatus: () => {
    // 更新所有已知 teamId 的时间戳
    set((state) => {
      const newTriggers: Record<string, number> = {};
      const now = Date.now();

      // 获取已有的所有 teamId
      Object.keys(state.refreshTriggers).forEach((teamId) => {
        newTriggers[teamId] = now;
      });

      return { refreshTriggers: newTriggers };
    });
  },
}));
