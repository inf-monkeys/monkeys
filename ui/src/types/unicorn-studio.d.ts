// Unicorn Studio类型定义
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

export {};
