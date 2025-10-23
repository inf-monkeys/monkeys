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
      // 等待更长时间确保3D模型完全渲染完成
      // 从500ms增加到2000ms，给复杂模型更多时间
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 额外检查：如果viewer还在加载中，再等待一段时间
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        const blob = await viewerRef.current?.captureScreenshot();

        if (blob && blob.size > 100) {
          // 确保截图有实际内容（大于1KB）
          console.log(`✅ [StepThumbnailGenerator] Screenshot captured successfully (${blob.size} bytes)`);
          completedRef.current = true;
          onComplete(blob);
          return;
        }

        // 如果截图太小或为空，说明模型可能还没完全渲染
        console.log(
          `⏳ [StepThumbnailGenerator] Screenshot too small or empty (${blob?.size || 0} bytes), retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retryCount++;
      }

      // 最后一次尝试
      const blob = await viewerRef.current?.captureScreenshot();
      if (!blob) {
        console.warn('⚠️ [StepThumbnailGenerator] Failed to capture screenshot after retries');
      } else {
        console.log(`⚠️ [StepThumbnailGenerator] Screenshot captured but may be incomplete (${blob.size} bytes)`);
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
