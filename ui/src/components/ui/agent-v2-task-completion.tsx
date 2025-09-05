import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Maximize2, Minimize2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';

interface IAgentV2TaskCompletionProps {
  result: string;
  className?: string;
}

export const AgentV2TaskCompletion: React.FC<IAgentV2TaskCompletionProps> = ({ result, className }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullExpanded, setIsFullExpanded] = useState(false);

  // 获取结果的简短预览（前100个字符）
  const getPreview = (text: string) => {
    const plainText = text
      .replace(/[#*`-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };
  const renderContent = (content: string) => {
    return (
      <div
        className="leading-relaxed text-green-800"
        dangerouslySetInnerHTML={{
          __html: content
            // 首先处理代码块（避免被其他规则影响）
            .replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
              return `<pre class="bg-green-100 text-green-900 p-3 rounded-md text-sm font-mono overflow-x-auto my-4"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
            })
            // 处理行内代码
            .replace(
              /`([^`]+)`/g,
              '<code class="bg-green-100 text-green-900 px-1 py-0.5 rounded text-xs font-mono">$1</code>',
            )
            // 处理标题
            .replace(/^### (.*?)$/gm, '<h3 class="text-sm font-semibold text-green-900 mt-4 mb-2">$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2 class="text-base font-semibold text-green-900 mt-4 mb-2">$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold text-green-900 mt-4 mb-2">$1</h1>')
            // 处理粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-green-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-green-800">$1</em>')
            // 处理有序列表
            .replace(/^\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
            // 处理无序列表
            .replace(/^[-•]\s+(.*?)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
            // 包装连续的列表项
            .replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
              return `<ul class="my-3 space-y-1">${match}</ul>`;
            })
            // 处理段落分隔
            .split('\n\n')
            .map((paragraph) => {
              // 跳过已经处理过的标签
              if (
                paragraph.includes('<h') ||
                paragraph.includes('<ul') ||
                paragraph.includes('<pre') ||
                paragraph.trim() === ''
              ) {
                return paragraph;
              }
              // 处理单行换行
              const processedParagraph = paragraph.replace(/\n/g, '<br />');
              return `<p class="mb-3 text-green-800 leading-relaxed">${processedParagraph}</p>`;
            })
            .join(''),
        }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(className)}
    >
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
        <CardHeader
          className={cn('cursor-pointer pb-3 transition-colors hover:bg-green-100/50', !isExpanded && 'pb-4')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-base text-green-900">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckCircle className="size-4 text-green-600" />
                <Sparkles className="size-3 text-yellow-500" />
              </div>
              任务完成
            </div>
            <Button variant="ghost" size="xs" className="h-6 w-6 p-0 text-green-700 hover:bg-green-200">
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CardTitle>

          {!isExpanded && <CardDescription className="mt-1 text-green-700">{getPreview(result)}</CardDescription>}
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent
                className={cn(
                  'prose prose-sm prose-green max-w-none overflow-y-auto',
                  isFullExpanded ? 'max-h-[80vh]' : 'max-h-96',
                )}
              >
                {renderContent(result)}

                {!isFullExpanded && result.length > 500 && (
                  <div className="mt-4 flex justify-center border-t border-green-200 pt-4">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullExpanded(true);
                      }}
                      className="text-green-700 hover:bg-green-100"
                    >
                      <Maximize2 className="mr-1 size-3" />
                      展开全部
                    </Button>
                  </div>
                )}

                {isFullExpanded && (
                  <div className="mt-4 flex justify-center border-t border-green-200 pt-4">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullExpanded(false);
                      }}
                      className="text-green-700 hover:bg-green-100"
                    >
                      <Minimize2 className="mr-1 size-3" />
                      收起
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
