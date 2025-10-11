import { getUnicornStudio, isUnicornStudioLoaded, loadUnicornStudio } from '@/lib/unicorn-studio';
import React, { useEffect, useRef, useState } from 'react';

interface DynamicBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ 
  className = '', 
  style = {} 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const initializeScene = async () => {
      if (!containerRef.current) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        const unicornStudio = getUnicornStudio();
        
        // 使用本地的JSON文件
        sceneRef.current = await unicornStudio.addScene({
          elementId: containerRef.current.id,
          fps: 60,
          scale: 1,
          dpi: 1.5,
          filePath: '/background.json', // 使用本地JSON文件
          lazyLoad: false,
          fixed: false,
          altText: 'Dynamic background animation',
          ariaLabel: 'Unicorn Studio dynamic background',
          production: false,
          interactivity: {
            mouse: {
              disableMobile: false,
              disabled: false,
            },
          },
        });
        
        setIsLoading(false);
        console.log('UnicornStudio scene initialized successfully');
      } catch (error) {
        console.error('Failed to initialize UnicornStudio scene:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const loadAndInitialize = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // 检查是否已经加载
        if (isUnicornStudioLoaded()) {
          await initializeScene();
          return;
        }

        // 加载SDK
        await loadUnicornStudio();
        
        // 初始化场景
        await initializeScene();
      } catch (error) {
        console.error('Error loading or initializing UnicornStudio:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadAndInitialize();

    // 清理函数
    return () => {
      if (sceneRef.current && sceneRef.current.destroy) {
        try {
          sceneRef.current.destroy();
        } catch (error) {
          console.error('Error destroying UnicornStudio scene:', error);
        }
      }
    };
  }, []);

  // 如果出错，显示备用背景
  if (hasError) {
    return (
      <div
        className={`fallback-background ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      id="unicorn-background"
      className={`unicorn-embed ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        ...style,
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
          }}
        >
          加载动态背景中...
        </div>
      )}
    </div>
  );
};
