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
import { InfiniteScroll } from '@/components/ui/infinite-scroll';
import { MediaPreview } from '@/components/ui/media-preview';
import { MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import type { DataItem } from '@/types/data';

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
            {data.map((item) => {
              // 检查是否有媒体文件且不是文本文件
              const mediaUrl = Array.isArray(item.media) ? item.media[0] : item.media;
              const isText = isTextFile(mediaUrl || item.thumbnail || '');
              const hasMedia = !isText && !!(item.thumbnail || item.media);

              return (
                <Card
                  key={item.id}
                  className={`relative flex flex-col break-inside-avoid mb-4 ${selectedIds.includes(item.id || '') ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className={hasMedia ? 'pb-3' : 'pb-2'}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedIds.includes(item.id || '')}
                          onCheckedChange={() => handleToggleSelection(item.id)}
                          aria-label="Select item"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{item.name}</h3>
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
                  {hasMedia && (
                    <CardContent className="p-0">
                      <MediaPreview
                        src={
                          Array.isArray(item.media)
                            ? item.media
                            : item.media || item.thumbnail || ''
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
          已选择 {selectedIds.length} 项 · 已加载 {data.length} / {total} 条数据
        </div>
      </div>
    </div>
  );
}
