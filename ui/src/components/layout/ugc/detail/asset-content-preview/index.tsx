import React, { useEffect, useState } from 'react';

import { Code, File, FileCode, FileSpreadsheet, FileText } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFileContentCache, useSetFileContentCache } from '@/store/useFileContentCacheStore';
import { cn } from '@/utils';

interface IAssetContentPreviewProps {
  asset: any;
  isThumbnail?: boolean; // 是否为缩略图模式
  className?: string;
}

export const AssetContentPreview: React.FC<IAssetContentPreviewProps> = ({ asset, isThumbnail = false, className }) => {
  // 使用缓存
  const {
    content: cachedContent,
    isLoading: cachedIsLoading,
    error: cachedError,
    hasContent,
  } = useFileContentCache(asset?.url || '');
  const { setContent, setLoading, setError } = useSetFileContentCache();

  // 本地状态（用于非缓存的情况）
  const [localContent, setLocalContent] = useState<string>('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  // 优先使用缓存，如果没有缓存则使用本地状态
  const content = cachedContent || localContent;
  const isLoading = cachedIsLoading || localIsLoading;
  const error = cachedError || localError;

  // 暂时移除访问信息更新，避免无限循环

  // 获取文件类型
  const getFileType = () => {
    const fileName = asset?.name || asset?.displayName || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension;
  };

  // 获取文件类型图标和颜色
  const getFileTypeInfo = () => {
    const fileType = getFileType();
    switch (fileType) {
      case 'json':
        return {
          icon: Code,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'txt':
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
      case 'md':
        return {
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950',
          borderColor: 'border-purple-200 dark:border-purple-800',
        };
      case 'csv':
        return {
          icon: FileSpreadsheet,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'log':
        return {
          icon: FileText,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
        };
      case 'xml':
        return {
          icon: FileCode,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'yaml':
      case 'yml':
        return {
          icon: FileCode,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950',
          borderColor: 'border-indigo-200 dark:border-indigo-800',
        };
      default:
        return {
          icon: File,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
    }
  };

  // 获取文件内容
  const fetchFileContent = async () => {
    if (!asset?.url) return;

    // 如果已经有缓存内容，直接返回
    if (hasContent) {
      return;
    }

    // 设置加载状态
    setLoading(asset.url, true);
    setLocalIsLoading(true);
    setError(asset.url, '');
    setLocalError('');

    try {
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const text = await response.text();

      // 保存到缓存
      setContent(asset.url, text);
      setLocalContent(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(asset.url, errorMessage);
      setLocalError(errorMessage);
    } finally {
      setLoading(asset.url, false);
      setLocalIsLoading(false);
    }
  };

  // 格式化JSON内容
  const formatJsonContent = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // 限制内容行数
  const limitContentLines = (text: string, maxLines: number = 1000) => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      return { content: text, isTruncated: false };
    }

    const truncatedLines = lines.slice(0, maxLines);
    const truncatedContent = truncatedLines.join('\n') + '\n\n... (内容过长，已截断显示前1000行)';
    return { content: truncatedContent, isTruncated: true };
  };

  // 获取预览内容（缩略图模式）
  const getPreviewContent = (fullContent: string, maxLength: number = 200) => {
    // 先限制行数
    const { content: limitedContent } = limitContentLines(fullContent, 50); // 缩略图最多50行

    if (limitedContent.length <= maxLength) {
      return limitedContent;
    }

    const fileType = getFileType();
    if (fileType === 'json') {
      try {
        const parsed = JSON.parse(limitedContent);
        const preview = JSON.stringify(parsed, null, 2);
        if (preview.length <= maxLength) {
          return preview;
        }
        // 截取JSON的前几行
        const lines = preview.split('\n');
        let result = '';
        for (const line of lines) {
          if (result.length + line.length + 1 <= maxLength) {
            result += (result ? '\n' : '') + line;
          } else {
            break;
          }
        }
        return result + '\n...';
      } catch {
        return limitedContent.substring(0, maxLength) + '...';
      }
    }

    return limitedContent.substring(0, maxLength) + '...';
  };

  // 渲染内容
  const renderContent = () => {
    const fileType = getFileType();

    if (isLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="text-sm text-gray-500">加载中...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="text-sm text-red-500">加载失败: {error}</div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="text-sm text-gray-500">暂无内容</div>
        </div>
      );
    }

    const displayContent = isThumbnail ? getPreviewContent(content) : content;
    const formattedContent = fileType === 'json' ? formatJsonContent(displayContent) : displayContent;

    return (
      <ScrollArea className={cn('w-full', isThumbnail ? 'h-32' : 'h-full')}>
        <pre
          className={cn(
            'whitespace-pre-wrap break-words p-3 font-mono text-xs',
            fileType === 'json' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200',
          )}
        >
          {formattedContent}
        </pre>
      </ScrollArea>
    );
  };

  // 预加载内容（当用户悬停时）
  const handleMouseEnter = () => {
    if (!hasContent && !isLoading && asset?.url) {
      fetchFileContent();
    }
  };

  // 自动加载内容
  useEffect(() => {
    if (!content && !isLoading && asset?.url) {
      fetchFileContent();
    }
  }, [asset?.url]); // 只依赖asset.url，避免重复加载

  const fileType = getFileType();
  const isTextFile = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(fileType || '');

  if (!isTextFile) {
    // 非文本文件显示默认图标
    return (
      <div className={cn('flex h-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800', className)}>
        <div className="text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-500">非文本文件</div>
        </div>
      </div>
    );
  }

  const fileTypeInfo = getFileTypeInfo();
  const IconComponent = fileTypeInfo.icon;

  // 缩略图模式 - 重新设计为更美观的卡片样式
  if (isThumbnail) {
    return (
      <div
        className={cn(
          'h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
          className,
        )}
        onMouseEnter={handleMouseEnter} // 悬停时预加载
      >
        {/* 内容预览区域 - 全尺寸显示 */}
        <div className="h-full overflow-hidden p-3">
          {content ? (
            <div className="h-full">
              <ScrollArea className="h-full">
                <pre
                  className={cn(
                    'overflow-hidden whitespace-pre-wrap break-words font-mono text-xs leading-tight',
                    fileType === 'json' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300',
                  )}
                >
                  {getPreviewContent(content, 500)}
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="px-2 text-center">
                <IconComponent className={cn('mx-auto mb-1 h-6 w-6', fileTypeInfo.color)} />
                <div className={cn('truncate text-xs font-medium', fileTypeInfo.color)}>
                  {asset?.name || asset?.displayName || '未知文件'}
                </div>
                <div className="mt-1 text-xs text-gray-500">加载中...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 完整模式 - 保持原有设计
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-0">
        {/* 文件类型标识 */}
        <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <IconComponent className={cn('h-4 w-4', fileTypeInfo.color)} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileType?.toUpperCase() || 'TEXT'}
            </span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="relative">{renderContent()}</div>
      </CardContent>
    </Card>
  );
};
