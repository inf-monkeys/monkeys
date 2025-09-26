import { StoreApi } from 'zustand';

import { createDesignBoardStore, DesignBoardStore } from './index';

// 全局共享的设计板 store 实例
let globalDesignBoardStore: StoreApi<DesignBoardStore> | null = null;

/**
 * 获取全局共享的设计板 store 实例
 * 如果不存在则创建一个新的实例
 */
export function getGlobalDesignBoardStore(): StoreApi<DesignBoardStore> {
  if (!globalDesignBoardStore) {
    globalDesignBoardStore = createDesignBoardStore();
  }
  return globalDesignBoardStore;
}

/**
 * 重置全局设计板 store 实例
 * 用于清理或重新初始化
 */
export function resetGlobalDesignBoardStore(): void {
  globalDesignBoardStore = null;
}

/**
 * 检查全局设计板 store 是否已初始化
 */
export function hasGlobalDesignBoardStore(): boolean {
  return globalDesignBoardStore !== null;
}
