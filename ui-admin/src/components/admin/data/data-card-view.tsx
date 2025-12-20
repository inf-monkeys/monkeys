import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaPreview } from '@/components/ui/media-preview';
import type { DataItem } from '@/types/data';
import { Edit, Eye, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  hasMore?: boolean;
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
  total = 0,
  hasMore: hasMoreProp,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
}: DataCardViewProps) {
  const hasMore = hasMoreProp ?? total > data.length;
  const [expandedKeywordItemIds, setExpandedKeywordItemIds] = useState<Set<string>>(() => new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreLockRef = useRef(false);

  // 注意：不要观测外层 grid item（它会被设置 gridRowEnd span），否则测量值会被 span 影响，导致滚动高度异常。
  const itemElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const itemSpansRef = useRef<Map<string, number>>(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const rowHeightPx = 6; // 更细腻
  const gapPx = 16; // 对应 grid gap-4

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

  useEffect(() => {
    if (!isLoading) {
      loadMoreLockRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !onPageChange) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (isLoading) return;
        if (!hasMore) return;
        if (loadMoreLockRef.current) return;

        loadMoreLockRef.current = true;
        onPageChange(currentPage + 1);
      },
      { root, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentPage, hasMore, isLoading, onPageChange]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const target = entry.target as HTMLDivElement;
        const id = target.dataset['id'];
        if (!id) continue;

        const height = Math.ceil(entry.contentRect.height);
        // grid-row-end: span N 的实际占用高度为：N*rowHeight + (N-1)*rowGap
        // 反推：span = ceil((height + rowGap) / (rowHeight + rowGap))
        const span = Math.max(1, Math.ceil((height + gapPx) / (rowHeightPx + gapPx)));
        if (itemSpansRef.current.get(id) !== span) {
          itemSpansRef.current.set(id, span);
          changed = true;
        }
      }

      if (changed) {
        setLayoutVersion((v) => v + 1);
      }
    });

    resizeObserverRef.current = resizeObserver;
    for (const el of itemElementsRef.current.values()) resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      if (resizeObserverRef.current === resizeObserver) {
        resizeObserverRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const ids = new Set<string>();
    for (const item of data) {
      if (item.id) ids.add(item.id);
    }

    let changed = false;
    for (const id of itemSpansRef.current.keys()) {
      if (!ids.has(id)) {
        itemSpansRef.current.delete(id);
        changed = true;
      }
    }
    if (changed) setLayoutVersion((v) => v + 1);
  }, [data]);

  const setMeasuredRef = (id?: string) => (node: HTMLDivElement | null) => {
    if (!id) return;

    const prev = itemElementsRef.current.get(id);
    if (prev && prev !== node) {
      resizeObserverRef.current?.unobserve(prev);
      itemElementsRef.current.delete(id);
    }

    if (node) {
      node.dataset['id'] = id;
      itemElementsRef.current.set(id, node);
      resizeObserverRef.current?.observe(node);
    }
  };

  const keywordList = useMemo(() => {
    void layoutVersion;
    return (item: DataItem) => {
      if (!item.keywords) return [];
      if (typeof item.keywords === 'string') {
        return item.keywords
          .split(/[,，;；\n\r|]+/)
          .map((k) => k.trim())
          .filter(Boolean);
      }
      if (Array.isArray(item.keywords)) return item.keywords;
      return [];
    };
  }, [layoutVersion]);

  if (isLoading && data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="flex h-full flex-col">
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4">
        <div
          className="grid gap-4"
          style={{
            gridAutoRows: `${rowHeightPx}px`,
            // 尽量保持“修改前 columns 布局”那种更紧凑的列宽，提升同屏列数
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          }}
        >
          {data.map((item) => {
            const mediaUrl = Array.isArray(item.media) ? item.media[0] : item.media;
            const isText = isTextFile(mediaUrl || item.thumbnail || '');
            const hasMedia = !isText && !!(item.thumbnail || item.media);

            const keywords = keywordList(item);
            const isKeywordsExpanded = !!item.id && expandedKeywordItemIds.has(item.id);
            const visibleKeywords = isKeywordsExpanded ? keywords : keywords.slice(0, 3);
            const restKeywordCount = Math.max(0, keywords.length - visibleKeywords.length);

            const title = (item.name || '').trim();
            const hasTitle = title.length > 0;
            const showHeader = hasTitle || keywords.length > 0 || !hasMedia;

            const span =
              (item.id && itemSpansRef.current.get(item.id)) ??
              Math.ceil(
                (((showHeader ? 140 : 0) + (hasMedia ? 280 : 0) + gapPx) / (rowHeightPx + gapPx))
              );

            return (
              <div
                key={item.id}
                style={{ gridRowEnd: `span ${span}` }}
              >
                <div ref={setMeasuredRef(item.id)} className="w-full">
                  <Card
                    className={
                      selectedIds.includes(item.id || '')
                        ? 'relative flex flex-col ring-2 ring-primary'
                        : 'relative flex flex-col'
                    }
                  >
                    {!showHeader && (
                      <>
                        <div className="absolute left-2 top-2 z-10">
                          <Checkbox
                            checked={selectedIds.includes(item.id || '')}
                            onCheckedChange={() => handleToggleSelection(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Select item"
                            className="bg-background/70 backdrop-blur-sm"
                          />
                        </div>
                        <div className="absolute right-2 top-2 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-background/70 backdrop-blur-sm"
                              >
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
                      </>
                    )}

                    {showHeader && (
                      <CardHeader className={hasMedia ? 'p-3' : 'p-3 pb-2'}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Checkbox
                              checked={selectedIds.includes(item.id || '')}
                              onCheckedChange={() => handleToggleSelection(item.id)}
                              aria-label="Select item"
                            />
                            <div className="min-w-0 flex-1">
                              {hasTitle && (
                                <h3 className="truncate text-sm font-semibold leading-none">{title}</h3>
                              )}
                              {keywords.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {visibleKeywords.map((k) => (
                                    <Badge
                                      key={k}
                                      variant="secondary"
                                      title={k}
                                      className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-normal"
                                    >
                                      {k}
                                    </Badge>
                                  ))}
                                  {restKeywordCount > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="cursor-pointer select-none font-normal"
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
                                      className="cursor-pointer select-none font-normal"
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
                    )}

                    {hasMedia && (
                      <CardContent className="p-0">
                        <MediaPreview
                          src={
                            Array.isArray(item.media) ? item.media : item.media || item.thumbnail || ''
                          }
                          alt={item.name}
                          type="auto"
                          thumbnail={item.thumbnail}
                          aspectRatio="square"
                          onViewAll={() => onView?.(item)}
                        />
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && <div ref={sentinelRef} className="h-px w-full" />}

        {isLoading && hasMore && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">加载更多...</p>
            </div>
          </div>
        )}

        {!hasMore && data.length > 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            已加载全部 {total} 条数据
          </div>
        )}
      </div>

      <div className="flex items-center border-t bg-background px-4 py-3">
        <div className="whitespace-nowrap text-sm text-muted-foreground">
          已选择 {selectedIds.length} 项 · 已加载 {data.length} / {total} 条数据
        </div>
      </div>
    </div>
  );
}
