import React, { useEffect, useRef } from 'react';

import { StepViewer, StepViewerRef } from './detail/step-viewer';

interface StepThumbnailGeneratorProps {
  fileUrl: string;
  fileName: string;
  onComplete: (blob: Blob | null) => void;
}

/**
 * STEP 文件缩略图生成器（隐藏组件）
 *
 * 在后台渲染 STEP 文件并生成缩略图，不在界面显示
 */
export const StepThumbnailGenerator: React.FC<StepThumbnailGeneratorProps> = ({ fileUrl, onComplete }) => {
  const viewerRef = useRef<StepViewerRef>(null);
  const completedRef = useRef(false);

  const handleReady = async () => {
    if (completedRef.current) {
      return;
    }

    try {
      // 等待一小段时间确保渲染完成
      await new Promise((resolve) => setTimeout(resolve, 500));

      const blob = await viewerRef.current?.captureScreenshot();

      if (!blob) {
        console.warn('⚠️ [StepThumbnailGenerator] Failed to capture screenshot');
      }

      completedRef.current = true;
      onComplete(blob || null);
    } catch (error) {
      console.error('❌ [StepThumbnailGenerator] Error capturing screenshot:', error);
      completedRef.current = true;
      onComplete(null);
    }
  };

  useEffect(() => {
    // 超时保护：如果30秒还没完成，就放弃
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete(null);
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="fixed left-[-9999px] top-0 h-[600px] w-[800px]" aria-hidden="true">
      <StepViewer ref={viewerRef} url={fileUrl} onReady={handleReady} />
    </div>
  );
};
