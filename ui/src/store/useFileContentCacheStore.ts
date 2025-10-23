import { create } from 'zustand';

interface IFileContentCacheItem {
  content: string;
  timestamp: number;
  isLoading: boolean;
  error?: string;
}

interface IFileContentCacheState {
  cache: { [url: string]: IFileContentCacheItem };
}

interface IFileContentCacheActions {
  setContent: (url: string, content: string) => void;
  setLoading: (url: string, isLoading: boolean) => void;
  setError: (url: string, error: string) => void;
  getContent: (url: string) => string | undefined;
  isLoading: (url: string) => boolean;
  getError: (url: string) => string | undefined;
  hasContent: (url: string) => boolean;
  clearCache: () => void;
  clearExpiredCache: (maxAge: number) => void;
}

const CACHE_MAX_AGE = 10 * 60 * 1000; // 10分钟缓存过期时间

export const useFileContentCacheStore = create<IFileContentCacheState & IFileContentCacheActions>()((set, get) => ({
  // 初始状态
  cache: {},

  // 设置文件内容
  setContent: (url: string, content: string) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [url]: {
          content,
          timestamp: Date.now(),
          isLoading: false,
          error: undefined,
        },
      },
    })),

  // 设置加载状态
  setLoading: (url: string, isLoading: boolean) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [url]: {
          ...state.cache[url],
          isLoading,
          error: undefined,
        },
      },
    })),

  // 设置错误状态
  setError: (url: string, error: string) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [url]: {
          ...state.cache[url],
          isLoading: false,
          error,
        },
      },
    })),

  // 获取文件内容（简化版本，不更新访问信息）
  getContent: (url: string) => {
    const state = get();
    const cached = state.cache[url];
    if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
      return cached.content;
    }
    return undefined;
  },

  // 检查是否正在加载
  isLoading: (url: string) => {
    const state = get();
    return state.cache[url]?.isLoading || false;
  },

  // 获取错误信息
  getError: (url: string) => {
    const state = get();
    return state.cache[url]?.error;
  },

  // 检查是否有缓存内容
  hasContent: (url: string) => {
    const state = get();
    const cached = state.cache[url];
    return !!(cached && cached.content && Date.now() - cached.timestamp < CACHE_MAX_AGE);
  },

  // 清除所有缓存
  clearCache: () => set({ cache: {} }),

  // 清除过期缓存
  clearExpiredCache: (maxAge: number = CACHE_MAX_AGE) =>
    set((state) => {
      const now = Date.now();
      const filteredCache: { [url: string]: IFileContentCacheItem } = {};

      Object.entries(state.cache).forEach(([url, cache]) => {
        if (now - cache.timestamp < maxAge) {
          filteredCache[url] = cache;
        }
      });

      return { cache: filteredCache };
    }),
}));

// 导出hooks
export const useFileContentCache = (url: string) => {
  const store = useFileContentCacheStore();
  return {
    content: store.getContent(url),
    isLoading: store.isLoading(url),
    error: store.getError(url),
    hasContent: store.hasContent(url),
  };
};

export const useSetFileContentCache = () => {
  const store = useFileContentCacheStore();
  return {
    setContent: store.setContent,
    setLoading: store.setLoading,
    setError: store.setError,
  };
};
