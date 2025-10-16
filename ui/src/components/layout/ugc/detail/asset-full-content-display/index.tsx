import React, { useState, useEffect } from 'react';
import { FileText, Code, Download, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/utils';

interface IAssetFullContentDisplayProps {
  asset: any;
  className?: string;
}

export const AssetFullContentDisplay: React.FC<IAssetFullContentDisplayProps> = ({
  asset,
  className,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

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

  // 格式化JSON内容
  const formatJsonContent = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // 获取原始内容（限制行数）
  const getRawContent = () => {
    const { content: limitedContent, isTruncated } = limitContentLines(content);
    return limitedContent;
  };

  // 获取格式化内容（限制行数）
  const getFormattedContent = () => {
    const fileType = getFileType();
    let formattedContent: string;
    
    if (fileType === 'json') {
      formattedContent = formatJsonContent(content);
    } else {
      formattedContent = content;
    }
    
    const { content: limitedContent, isTruncated } = limitContentLines(formattedContent);
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
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              非文本文件
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              此文件类型不支持内容预览
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-full flex flex-col", className, isFullscreen && "fixed inset-0 z-50 m-0")}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {fileType === 'json' ? (
              <Code className="h-5 w-5 text-blue-600" />
            ) : (
              <FileText className="h-5 w-5 text-gray-600" />
            )}
            <span className="text-lg font-semibold">
              {asset?.name || asset?.displayName || '未知文件'}
            </span>
            <span className="text-sm text-gray-500 font-normal">
              ({fileType?.toUpperCase() || 'TEXT'})
            </span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="small"
              onClick={handleCopy}
              disabled={!content || isLoading}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制' : '复制'}
            </Button>
            
            <Button
              variant="outline"
              size="small"
              onClick={handleDownload}
              disabled={!content || isLoading}
            >
              <Download className="h-4 w-4" />
              下载
            </Button>
            
            <Button
              variant="outline"
              size="small"
              onClick={toggleFullscreen}
              disabled={!content || isLoading}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg font-medium text-red-600 mb-2">加载失败</div>
              <div className="text-sm text-gray-500">{error}</div>
              <Button
                variant="outline"
                size="small"
                onClick={fetchFileContent}
                className="mt-4"
              >
                重试
              </Button>
            </div>
          </div>
        ) : content ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="content"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-md"
              >
                格式化内容
              </TabsTrigger>
              <TabsTrigger 
                value="raw"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-md"
              >
                原始内容
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className={cn("w-full h-full", isFullscreen ? "h-[calc(100vh-200px)]" : "h-full")}>
                <pre className={cn(
                  "text-sm font-mono whitespace-pre-wrap break-words p-4 overflow-hidden",
                  fileType === 'json' ? "text-blue-800 dark:text-blue-200" : "text-gray-800 dark:text-gray-200"
                )}>
                  {getFormattedContent()}
                </pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="raw" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className={cn("w-full h-full", isFullscreen ? "h-[calc(100vh-200px)]" : "h-full")}>
                <pre className="text-sm font-mono whitespace-pre-wrap break-words p-4 overflow-hidden text-gray-800 dark:text-gray-200">
                  {getRawContent()}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                暂无内容
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                点击加载按钮获取文件内容
              </div>
              <Button
                variant="outline"
                size="small"
                onClick={fetchFileContent}
                className="mt-4"
              >
                加载内容
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
