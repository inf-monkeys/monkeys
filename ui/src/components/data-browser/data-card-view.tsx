import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { MediaPreview } from '@/components/ui/media-preview';
import type { DataItem } from '@/types/data';
import { Edit, Eye, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * 检测是否是文本文件
 */
function isTextFile(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return !!lowerUrl.match(/\.(txt|md|csv|json|xml|log|conf|ini|yaml|yml)$/);
}

interface DataCardViewProps {
  data: DataItem[];
  isLoading?: boolean;
  selectedIds?: string[];
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (item: DataItem) => void;
  onDelete?: (item: DataItem) => void;
  onView?: (item: DataItem) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataCardView({
  data,
  isLoading,
  selectedIds = [],
  currentPage = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
}: DataCardViewProps) {
  const hasMore = total > data.length;
  const [expandedKeywordItemIds, setExpandedKeywordItemIds] = useState<Set<string>>(() => new Set());

  const toggleKeywordsExpanded = (itemId?: string) => {
    if (!itemId) return;
    setExpandedKeywordItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleSelection = (itemId: string | undefined) => {
    if (!itemId || !onSelectionChange) return;

    const newSelectedIds = selectedIds.includes(itemId)
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];

    onSelectionChange(newSelectedIds);
  };

  const handleLoadMore = () => {
    if (onPageChange && hasMore && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && !isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 瀑布流卡片 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
          <InfiniteScroll
            isLoading={!!isLoading}
            hasMore={hasMore}
            next={handleLoadMore}
            threshold={0.8}
          >
            {data.map((item, index) => {
              // 检查是否有媒体文件且不是文本文件
              const mediaUrl = Array.isArray(item.media) ? item.media[0] : item.media;
              const isText = isTextFile(mediaUrl || item.thumbnail || '');
              const hasMedia = !isText && !!(item.thumbnail || item.media);
              const mediaDisplayUrl = Array.isArray(item.media)
                ? item.media
                : item.media || item.thumbnail || '';

              const keywords = Array.isArray(item.keywords) ? item.keywords : [];
              const isKeywordsExpanded = !!item.id && expandedKeywordItemIds.has(item.id);
              const visibleKeywords = isKeywordsExpanded ? keywords : keywords.slice(0, 3);
              const restKeywordCount = Math.max(0, keywords.length - visibleKeywords.length);

              return (
                <Card
                  key={item.id}
                  className="relative flex flex-col break-inside-avoid mb-4"
                >
                  <CardHeader className={hasMedia ? 'pb-3' : 'pb-2'}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        {keywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {visibleKeywords.map((k) => (
                              <Badge
                                key={k}
                                variant="secondary"
                                title={k}
                                className="font-normal max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                              >
                                {k}
                              </Badge>
                            ))}
                            {restKeywordCount > 0 && (
                              <Badge
                                variant="outline"
                                className="font-normal cursor-pointer select-none"
                                role="button"
                                tabIndex={0}
                                aria-expanded={isKeywordsExpanded}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleKeywordsExpanded(item.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleKeywordsExpanded(item.id);
                                  }
                                }}
                              >
                                +{restKeywordCount}
                              </Badge>
                            )}
                            {isKeywordsExpanded && keywords.length > 3 && (
                              <Badge
                                variant="outline"
                                className="font-normal cursor-pointer select-none"
                                role="button"
                                tabIndex={0}
                                aria-expanded={isKeywordsExpanded}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleKeywordsExpanded(item.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleKeywordsExpanded(item.id);
                                  }
                                }}
                              >
                                收起
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  {hasMedia && (
                    <CardContent className="p-0">
                      <MediaPreview
                        src={mediaDisplayUrl}
                        alt={item.name}
                        type="auto"
                        thumbnail={item.thumbnail}
                        aspectRatio="square"
                        onViewAll={() => onView?.(item)}
                      />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </InfiniteScroll>
        </div>

        {/* 加载状态 */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">加载更多...</p>
            </div>
          </div>
        )}

        {/* 已加载全部 */}
        {!hasMore && data.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            已加载全部 {total} 条数据
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className="flex items-center border-t bg-background px-4 py-3">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          已加载 {data.length} / {total} 条数据
        </div>
      </div>
    </div>
  );
}
