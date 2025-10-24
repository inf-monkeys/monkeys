import React, { useEffect, useState } from 'react';

import { Check, Code, Copy, Download, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';

import { LazyAssetPreview } from './components/lazy-asset-preview';

interface IAssetFullContentDisplayProps {
  asset: any;
  className?: string;
}

export const AssetFullContentDisplay: React.FC<IAssetFullContentDisplayProps> = ({ asset, className }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // 获取文件类型
  const getFileType = () => {
    const fileName = asset?.name || asset?.displayName || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension;
  };

  // 获取文件内容
  const fetchFileContent = async () => {
    if (!asset?.url) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
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

  // 获取原始内容（限制行数）
  const getRawContent = () => {
    const { content: limitedContent } = limitContentLines(content);
    return limitedContent;
  };

  // 复制内容到剪贴板
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('内容已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('复制失败');
    }
  };

  // 下载文件
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset?.name || asset?.displayName || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 自动加载内容
  useEffect(() => {
    if (!content && !isLoading) {
      fetchFileContent();
    }
  }, [content, isLoading]);

  const fileType = getFileType();
  const isTextFile = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(fileType || '');

  if (!isTextFile) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <div className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-400">非文本文件</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">此文件类型不支持内容预览</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full w-full flex-col', className, isFullscreen && 'fixed inset-0 z-50 m-0')}>
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {fileType === 'json' ? (
              <Code className="h-5 w-5 text-blue-600" />
            ) : (
              <FileText className="h-5 w-5 text-gray-600" />
            )}
            <span className="text-lg font-semibold">{asset?.name || asset?.displayName || '未知文件'}</span>
            <span className="text-sm font-normal text-gray-500">({fileType?.toUpperCase() || 'TEXT'})</span>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="small" onClick={handleCopy} disabled={!content || isLoading}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制' : '复制'}
            </Button>

            <Button variant="outline" size="small" onClick={handleDownload} disabled={!content || isLoading}>
              <Download className="h-4 w-4" />
              下载
            </Button>

            <Button variant="outline" size="small" onClick={toggleFullscreen} disabled={!content || isLoading}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-lg font-medium text-red-600">加载失败</div>
              <div className="text-sm text-gray-500">{error}</div>
              <Button variant="outline" size="small" onClick={fetchFileContent} className="mt-4">
                重试
              </Button>
            </div>
          </div>
        ) : content ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full w-full flex-col">
            <TabsList className="grid w-full flex-shrink-0 grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-md"
              >
                {getFileType() === 'json' ? '智能预览' : '格式化内容'}
              </TabsTrigger>
              <TabsTrigger
                value="raw"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-md"
              >
                原始内容
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-0 flex-1 overflow-hidden">
              {getFileType() === 'json' ? (
                <LazyAssetPreview
                  content={content}
                  fileName={asset?.name || asset?.displayName || '未知文件'}
                  className="h-full"
                  style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '100%' }}
                  maxContentLength={50000}
                  enablePartialRender={true}
                />
              ) : (
                <ScrollArea className={cn('h-full w-full', isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-full')}>
                  <pre className="overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-800 dark:text-gray-200">
                    {getRawContent()}
                  </pre>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className={cn('h-full w-full', isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-full')}>
                <pre className="overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm text-gray-800 dark:text-gray-200">
                  {getRawContent()}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-400">暂无内容</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">点击加载按钮获取文件内容</div>
              <Button variant="outline" size="small" onClick={fetchFileContent} className="mt-4">
                加载内容
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
