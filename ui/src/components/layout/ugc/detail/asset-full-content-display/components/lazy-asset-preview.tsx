import React, { lazy, Suspense, useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils';

// 懒加载 VinesAbstractDataPreview
const LazyVinesAbstractDataPreview = lazy(() =>
  import('@/components/layout/workspace/vines-view/_common/data-display/abstract/index.tsx').then((module) => ({
    default: module.VinesAbstractDataPreview,
  })),
);

interface ILazyAssetPreviewProps {
  content: string;
  fileName: string;
  className?: string;
  style?: React.CSSProperties;
  maxContentLength?: number; // 最大内容长度，超过则只渲染部分
  enablePartialRender?: boolean; // 是否启用部分渲染
}

export const LazyAssetPreview: React.FC<ILazyAssetPreviewProps> = ({
  content,
  fileName,
  className,
  style,
  maxContentLength = 1000000, // 默认1MB
  enablePartialRender = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isPartialContent, setIsPartialContent] = useState(false);

  // 解析内容为 VinesAbstractDataPreview 可以处理的格式
  useEffect(() => {
    if (content) {
      setIsLoading(true);

      // 使用 setTimeout 确保加载状态可见
      setTimeout(() => {
        try {
          // 尝试解析为 JSON
          const jsonData = JSON.parse(content);
          setParsedData(jsonData);
        } catch {
          // 如果不是 JSON，创建文本数据格式
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          setParsedData({
            content: content,
            type: fileExtension,
            fileName: fileName,
            originalLength: content.length,
          });
        }
        // 检查是否需要部分渲染
        if (enablePartialRender && content.length > maxContentLength) {
          setIsPartialContent(true);
        }
        setIsLoading(false);
      }, 300); // 至少显示300ms的加载状态
    }
  }, [content, fileName, maxContentLength, enablePartialRender]);

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center bg-gray-50/80 backdrop-blur-sm dark:bg-gray-800/80', className)}
        style={style}
      >
        <div className="text-center">
          <div className="relative">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <div className="absolute inset-0 mx-auto mb-4 h-10 w-10 animate-ping rounded-full bg-blue-200 opacity-20"></div>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">正在解析内容...</div>
          <div className="mt-1 text-xs text-gray-500">请稍候</div>
        </div>
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className={cn('flex w-full flex-col items-center justify-center gap-2', className)} style={style}>
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-400">暂无内容</div>
          <div className="text-sm text-gray-500 dark:text-gray-500">文件内容为空或无法解析</div>
        </div>
      </div>
    );
  }

  // 处理内容截断
  const getProcessedData = () => {
    if (!parsedData) return null;
    if (enablePartialRender && isPartialContent) {
      // 如果是文本内容，截断字符串
      if (parsedData.content && typeof parsedData.content === 'string') {
        return {
          ...parsedData,
          content: parsedData.content.substring(0, maxContentLength) + '\n\n... (内容过长，已截断显示)',
        };
      }
      // 如果是 JSON 对象，智能截断数组或对象
      if (typeof parsedData === 'object' && !parsedData.content) {
        if (Array.isArray(parsedData)) {
          // 如果是数组，只显示前几个元素
          const maxItems = Math.floor(maxContentLength / 1000); // 根据内容长度估算最大项目数
          const actualMaxItems = Math.min(maxItems, 100); // 最多显示100个项目
          const truncatedArray = parsedData.slice(0, actualMaxItems);

          // 如果数组长度不足，不需要截断
          if (parsedData.length <= actualMaxItems) {
            return parsedData; // 返回完整数组，不添加截断信息
          }

          return {
            ...truncatedArray,
            _truncated: true,
            _totalItems: parsedData.length,
            _message: `数组包含 ${parsedData.length} 个项目，仅显示前 ${truncatedArray.length} 个`,
          };
        } else {
          // 如果是对象，限制属性数量
          const keys = Object.keys(parsedData);
          if (keys.length > 20) {
            // 如果属性太多
            const limitedKeys = keys.slice(0, 20);
            const limitedObject = {};
            limitedKeys.forEach((key) => {
              limitedObject[key] = parsedData[key];
            });
            return {
              ...limitedObject,
              _truncated: true,
              _totalKeys: keys.length,
              _message: `对象包含 ${keys.length} 个属性，仅显示前 20 个`,
            };
          }
        }
      }
    }
    return parsedData;
  };

  return (
    <div className={cn('h-full w-full', className)} style={style}>
      {isPartialContent && (
        <div className="mb-2 rounded-md bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <span>
              {parsedData && Array.isArray(parsedData)
                ? (() => {
                    const maxItems = Math.floor(maxContentLength / 1000);
                    const actualMaxItems = Math.min(maxItems, 100);
                    return `数据包含 ${parsedData.length} 个项目，仅显示前 ${actualMaxItems} 个`;
                  })()
                : parsedData && typeof parsedData === 'object' && Object.keys(parsedData).length > 20
                  ? `数据包含 ${Object.keys(parsedData).length} 个属性，仅显示前 20 个`
                  : `文件较大，仅显示前 ${maxContentLength.toLocaleString()} 个字符`}
            </span>
          </div>
        </div>
      )}
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <LazyVinesAbstractDataPreview data={getProcessedData()} className="h-full" overflowMask={true} />
      </Suspense>
    </div>
  );
};
