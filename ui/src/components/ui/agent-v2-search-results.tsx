import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, Globe, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';
import { IParsedWebSearchResult, ISearchResultItem } from '@/utils/sse-event-parser';

interface IAgentV2SearchResultsProps {
  searchResult: IParsedWebSearchResult;
  className?: string;
}

const SearchResultItem: React.FC<{ item: ISearchResultItem; index: number }> = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-lg border border-blue-100 bg-blue-50/30 p-3 transition-colors hover:bg-blue-50/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-1 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
              >
                {item.title}
              </a>
            ) : (
              <h4 className="line-clamp-1 text-sm font-medium text-blue-700">{item.title}</h4>
            )}

            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="xs" className="h-4 w-4 p-0 text-blue-600 hover:bg-blue-200">
                  <ExternalLink className="size-3" />
                </Button>
              </a>
            )}
          </div>

          {item.snippet && <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{item.snippet}</p>}

          {item.source && (
            <div className="mt-2">
              <Badge variant="outline" className="border-blue-200 bg-white/50 text-xs">
                <Globe className="mr-1 size-3" />
                {item.source}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const AgentV2SearchResults: React.FC<IAgentV2SearchResultsProps> = ({ searchResult, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!searchResult.query && !searchResult.results?.length && !searchResult.summary) {
    return null;
  }

  const hasResults = searchResult.results && searchResult.results.length > 0;
  const resultCount = searchResult.results?.length || 0;

  const getPreview = () => {
    if (searchResult.summary) {
      return searchResult.summary.substring(0, 100) + (searchResult.summary.length > 100 ? '...' : '');
    }
    if (hasResults) {
      return `找到 ${resultCount} 个相关结果`;
    }
    return '搜索完成';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('relative z-10', className)}
    >
      <Card
        className={cn(
          'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm',
          className?.includes('compact-mode') && 'border-green-100 bg-green-50/50 shadow-none',
        )}
      >
        <CardHeader
          className={cn('cursor-pointer pb-3 transition-colors hover:bg-green-100/50', !isExpanded && 'pb-4')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-base text-green-900">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Search className="size-4 text-green-600" />
                <Globe className="size-3 text-green-500" />
              </div>
              网络搜索结果
              {searchResult.query && (
                <Badge variant="outline" className="border-green-200 bg-white/50 text-xs text-green-700">
                  {searchResult.query}
                </Badge>
              )}
              {hasResults && (
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <span>({resultCount} 个结果)</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="xs" className="h-6 w-6 p-0 text-green-700 hover:bg-green-200">
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CardTitle>

          {!isExpanded && <CardDescription className="mt-1 text-green-700">{getPreview()}</CardDescription>}
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
              <CardContent className="space-y-3">
                {/* 搜索摘要 */}
                {searchResult.summary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-green-200/50 bg-white/60 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Search className="size-4 text-green-600" />
                      <h4 className="text-sm font-medium text-green-800">搜索摘要</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-green-700">{searchResult.summary}</p>
                  </motion.div>
                )}

                {/* 搜索结果列表 */}
                {hasResults ? (
                  <div className="space-y-2">
                    <div className="mb-2 flex items-center gap-2">
                      <Globe className="size-4 text-green-600" />
                      <h4 className="text-sm font-medium text-green-800">相关链接</h4>
                      <Badge variant="secondary" className="bg-green-100 text-xs text-green-700">
                        {resultCount} 个结果
                      </Badge>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {searchResult.results.map((item, index) => (
                        <SearchResultItem key={`${item.url}-${index}`} item={item} index={index} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-sm text-green-600"
                  >
                    没有找到具体的搜索结果链接
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
