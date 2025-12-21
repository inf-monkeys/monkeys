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
import { MediaPreview } from '@/components/ui/media-preview';
import type { DataItem } from '@/types/data';
import { Edit, Eye, Loader2, MoreHorizontal, Pin, PinOff, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
  hasMore?: boolean;
  onPageChange?: (page: number) => void;
  onEdit?: (item: DataItem) => void;
  onDelete?: (item: DataItem) => void;
  onView?: (item: DataItem) => void;
  onPinToggle?: (item: DataItem) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataCardView({
  data,
  isLoading,
  currentPage = 1,
  total = 0,
  hasMore: hasMoreProp,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onPinToggle,
}: DataCardViewProps) {
  const hasMore = hasMoreProp ?? total > data.length;
  const [expandedKeywordItemIds, setExpandedKeywordItemIds] = useState<Set<string>>(() => new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const masonryContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const itemHeightsRef = useRef<Map<string, number>>(new Map());
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 0));
  const [layoutVersion, setLayoutVersion] = useState(0);
  const loadMoreLockRef = useRef(false);
  const updateWidthRef = useRef<(() => void) | null>(null);
  const widthObserverRef = useRef<ResizeObserver | null>(null);

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

  useEffect(() => {
    if (!isLoading) {
      loadMoreLockRef.current = false;
    }
  }, [isLoading]);

  useLayoutEffect(() => {
    // 组件初次渲染可能处于 loading/空态分支，此时 scrollContainerRef 还不存在。
    // 当数据到达并渲染出滚动容器后，需要重新挂载测量逻辑，否则 containerWidth 会一直是 0。
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const updateWidth = () => {
      const computed = window.getComputedStyle(scrollContainer);
      const paddingLeft = Number.parseFloat(computed.paddingLeft || '0') || 0;
      const paddingRight = Number.parseFloat(computed.paddingRight || '0') || 0;
      const contentWidth = Math.max(0, scrollContainer.clientWidth - paddingLeft - paddingRight);
      setContainerWidth(contentWidth);
    };

    updateWidthRef.current = updateWidth;

    // 先断开旧 observer（如果之前因切换视图/状态重跑了 effect）
    if (widthObserverRef.current) {
      widthObserverRef.current.disconnect();
      widthObserverRef.current = null;
    }

    updateWidth();

    // 初次进入/刷新时某些布局可能会先以 0 宽度挂载（例如容器隐藏/过渡中），
    // 使用 rAF 再测几帧，尽量在可见后尽快拿到有效宽度。
    const raf1 = requestAnimationFrame(() => updateWidth());
    const raf2 = requestAnimationFrame(() => updateWidth());

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(scrollContainer);
    widthObserverRef.current = observer;

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
      if (widthObserverRef.current === observer) {
        widthObserverRef.current = null;
      }
    };
  }, [data.length, isLoading]);

  useEffect(() => {
    if (containerWidth > 0) return;
    const updateWidth = updateWidthRef.current;
    if (!updateWidth) return;

    let cancelled = false;
    let tries = 0;
    let rafId = 0;

    const tick = () => {
      if (cancelled) return;
      if (containerWidth > 0) return;
      if (tries >= 30) return;
      tries += 1;
      updateWidth();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [containerWidth]);

  useEffect(() => {
    const handler = () => setViewportWidth(window.innerWidth);
    handler();
    window.addEventListener('resize', handler, { passive: true } as any);
    return () => window.removeEventListener('resize', handler as any);
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const target = entry.target as HTMLDivElement;
        const id = target.dataset['id'];
        if (!id) continue;

        const height = Math.ceil(entry.contentRect.height);
        if (itemHeightsRef.current.get(id) !== height) {
          itemHeightsRef.current.set(id, height);
          changed = true;
        }
      }

      if (changed) {
        setLayoutVersion((v) => v + 1);
      }
    });

    for (const el of itemElementsRef.current.values()) {
      resizeObserver.observe(el);
    }

    return () => resizeObserver.disconnect();
  }, [data.length]);

  const columnCount = useMemo(() => {
    // 跟 Tailwind 断点一致：根据 viewport 决定列数，确保体验与之前 `md/lg/xl:columns-*` 一致
    if (viewportWidth >= 1280) return 4;
    if (viewportWidth >= 1024) return 3;
    if (viewportWidth >= 768) return 2;
    return 1;
  }, [viewportWidth]);

  const gapPx = 16;

  const estimatedHeights = useMemo(() => {
    const availableWidth = Math.max(0, containerWidth - gapPx * (columnCount - 1));
    const columnWidth = columnCount > 0 ? availableWidth / columnCount : 0;
    const estimatedHeaderHeight = 84;

    return new Map<string, number>(
      data
        .filter((item) => !!item.id)
        .map((item) => {
          const mediaUrl = Array.isArray(item.media) ? item.media[0] : item.media;
          const isText = isTextFile(mediaUrl || item.thumbnail || '');
          const hasMedia = !isText && !!(item.thumbnail || item.media);

          const estimatedHeight = hasMedia
            ? Math.ceil(estimatedHeaderHeight + columnWidth)
            : estimatedHeaderHeight;

          return [item.id as string, estimatedHeight];
        })
    );
  }, [containerWidth, columnCount, data]);

  const masonryLayout = useMemo(() => {
    const availableWidth = Math.max(0, containerWidth - gapPx * (columnCount - 1));
    const columnWidth = columnCount > 0 ? availableWidth / columnCount : 0;
    const columnHeights = new Array(columnCount).fill(0) as number[];

    const positions = new Map<string, { x: number; y: number; width: number }>();

    for (const item of data) {
      if (!item.id) continue;

      const height =
        itemHeightsRef.current.get(item.id) ?? estimatedHeights.get(item.id) ?? 0;

      let targetCol = 0;
      for (let col = 1; col < columnHeights.length; col++) {
        if (columnHeights[col] < columnHeights[targetCol]) targetCol = col;
      }

      const x = targetCol * (columnWidth + gapPx);
      const y = columnHeights[targetCol];

      positions.set(item.id, { x, y, width: columnWidth });
      columnHeights[targetCol] = y + height + gapPx;
    }

    const height = columnHeights.length ? Math.max(...columnHeights) : 0;
    return { positions, height };
  }, [containerWidth, columnCount, data, estimatedHeights, layoutVersion]);

  const isLayoutReady = containerWidth > 0;

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

  const setItemRef = (id?: string) => (node: HTMLDivElement | null) => {
    if (!id) return;

    const prev = itemElementsRef.current.get(id);
    if (prev && prev !== node) {
      itemElementsRef.current.delete(id);
    }

    if (node) {
      node.dataset['id'] = id;
      itemElementsRef.current.set(id, node);
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
      {/* Masonry 卡片（追加稳定；列数变化允许重排） */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4">
        <div
          ref={masonryContainerRef}
          className="relative w-full"
          style={{ height: masonryLayout.height }}
        >
          {data.map((item) => {
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
            const title = (item.name || '').trim();
            const hasTitle = title.length > 0;
            const hasKeywords = keywords.length > 0;
            const showHeader = hasTitle || hasKeywords;

            const pos = item.id ? masonryLayout.positions.get(item.id) : undefined;

            return (
              <div
                key={item.id}
                style={
                  isLayoutReady && pos
                    ? {
                        position: 'absolute',
                        width: pos.width,
                        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                      }
                    : undefined
                }
              >
	                <div ref={setItemRef(item.id)}>
	                  <Card className="relative flex flex-col">
	                    <DropdownMenu>
	                      {/* 有标题/标签时：菜单按钮跟标题同一行；否则：浮在右上角 */}
	                      {showHeader ? null : (
	                        <div className="absolute right-2 top-2 z-10">
	                          <DropdownMenuTrigger asChild>
	                            <Button
	                              variant="ghost"
	                              size="icon"
	                              className="h-8 w-8 bg-background/70 backdrop-blur-sm"
	                            >
	                              <MoreHorizontal className="h-4 w-4" />
	                              <span className="sr-only">打开菜单</span>
	                            </Button>
	                          </DropdownMenuTrigger>
	                        </div>
	                      )}

	                    {showHeader && (
	                      <CardHeader className={hasMedia ? 'pt-3 pb-3' : 'pt-3 pb-2'}>
	                        <div className="flex items-center justify-between gap-2">
	                          <div className="min-w-0 flex-1">
	                            {hasTitle ? (
	                              <h3 className="truncate text-sm font-semibold leading-none">{title}</h3>
	                            ) : (
	                              <div />
	                            )}
	                          </div>
	                          <div className="shrink-0">
	                            <DropdownMenuTrigger asChild>
	                              <Button variant="ghost" size="icon" className="h-8 w-8">
	                                <MoreHorizontal className="h-4 w-4" />
	                                <span className="sr-only">打开菜单</span>
	                              </Button>
	                            </DropdownMenuTrigger>
	                          </div>
	                        </div>

	                        {hasKeywords && (
	                          <div className="mt-1 flex flex-wrap gap-2">
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
	                      </CardHeader>
	                    )}

	                      <DropdownMenuContent align="end">
	                        <DropdownMenuLabel>操作</DropdownMenuLabel>
	                        <DropdownMenuSeparator />
	                        {onView && (
	                          <DropdownMenuItem onClick={() => onView(item)}>
	                            <Eye className="mr-2 h-4 w-4" />
	                            查看详情
	                          </DropdownMenuItem>
	                        )}
                          {onPinToggle && (
                            <DropdownMenuItem onClick={() => onPinToggle(item)}>
                              {(item.pinOrder ?? 0) > 0 ? (
                                <PinOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Pin className="mr-2 h-4 w-4" />
                              )}
                              {(item.pinOrder ?? 0) > 0 ? '取消置顶' : '置顶'}
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
                </div>
              </div>
            );
          })}
        </div>

        {/* 哨兵元素用于触发无限滚动（基于滚动容器 root） */}
        {hasMore && <div ref={sentinelRef} className="h-px w-full" />}

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
