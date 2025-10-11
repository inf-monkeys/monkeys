// Unicorn Studio SDK 本地模块
// 这个文件用于管理Unicorn Studio SDK的加载和初始化

declare global {
  interface Window {
    UnicornStudio: {
      init: () => Promise<any>;
      addScene: (config: {
        elementId: string;
        fps?: number;
        scale?: number;
        dpi?: number;
        projectId?: string;
        lazyLoad?: boolean;
        filePath?: string;
        fixed?: boolean;
        altText?: string;
        ariaLabel?: string;
        production?: boolean;
        interactivity?: {
          mouse?: {
            disableMobile?: boolean;
            disabled?: boolean;
          };
        };
      }) => Promise<{
        destroy: () => void;
        resize: () => void;
        paused: boolean;
      }>;
      destroy: () => void;
    };
  }
}

let isLoaded = false;
let isLoading = false;
const loadPromises: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];

/**
 * 加载Unicorn Studio SDK
 * @returns Promise<void>
 */
export const loadUnicornStudio = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 如果已经加载，直接返回
    if (isLoaded && window.UnicornStudio) {
      resolve();
      return;
    }

    // 如果正在加载，等待加载完成
    if (isLoading) {
      loadPromises.push({ resolve, reject });
      return;
    }

    // 开始加载
    isLoading = true;

    // 检查是否已经有脚本标签存在
    const existingScript = document.querySelector('script[src="/unicornStudio.umd.js"]');
    if (existingScript) {
      // 等待脚本加载完成
      const checkLoaded = () => {
        if (window.UnicornStudio) {
          isLoaded = true;
          isLoading = false;
          resolve();
          // 解决所有等待的promise
          loadPromises.forEach(({ resolve: r }) => r());
          loadPromises.length = 0;
        } else {
          setTimeout(checkLoaded, 50);
        }
      };
      checkLoaded();
      return;
    }

    // 创建并加载脚本
    const script = document.createElement('script');
    script.src = '/unicornStudio.umd.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // 等待一小段时间确保脚本完全初始化
      setTimeout(() => {
        if (window.UnicornStudio) {
          isLoaded = true;
          isLoading = false;
          resolve();
          // 解决所有等待的promise
          loadPromises.forEach(({ resolve: r }) => r());
          loadPromises.length = 0;
        } else {
          const error = new Error('UnicornStudio SDK loaded but not available on window object');
          isLoading = false;
          reject(error);
          // 拒绝所有等待的promise
          loadPromises.forEach(({ reject: r }) => r(error));
          loadPromises.length = 0;
        }
      }, 100);
    };

    script.onerror = (error) => {
      const loadError = new Error(`Failed to load UnicornStudio SDK: ${error}`);
      isLoading = false;
      reject(loadError);
      // 拒绝所有等待的promise
      loadPromises.forEach(({ reject: r }) => r(loadError));
      loadPromises.length = 0;
    };

    document.head.appendChild(script);
  });
};

/**
 * 检查Unicorn Studio SDK是否已加载
 * @returns boolean
 */
export const isUnicornStudioLoaded = (): boolean => {
  return isLoaded && !!window.UnicornStudio;
};

/**
 * 获取Unicorn Studio SDK实例
 * @returns UnicornStudio SDK instance
 */
export const getUnicornStudio = () => {
  if (!isLoaded || !window.UnicornStudio) {
    throw new Error('UnicornStudio SDK is not loaded');
  }
  return window.UnicornStudio;
};
