import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import type { DataItem } from '@/types/data';
import { format } from 'date-fns';

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
  const handleToggleSelection = (itemId: string | undefined) => {
    if (!itemId || !onSelectionChange) return;

    const newSelectedIds = selectedIds.includes(itemId)
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];

    onSelectionChange(newSelectedIds);
  };

  const handleToggleAll = () => {
    if (!onSelectionChange) return;

    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item.id).filter((id): id is string => !!id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 卡片网格 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item) => (
            <Card
              key={item.id}
              className={`relative ${selectedIds.includes(item.id || '') ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-3">
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
                      {(item.description || item.primaryContent?.description) && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.description || item.primaryContent?.description}
                        </p>
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
              <CardContent className="space-y-2">
                {/* 缩略图或图标 */}
                {item.thumbnail && (
                  <div className="aspect-video w-full rounded-md overflow-hidden bg-muted">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* 元数据 */}
                <div className="space-y-1.5 text-xs">
                  {(item.type || item.assetType) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">类型</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.type || item.assetType}
                      </Badge>
                    </div>
                  )}
                  {item.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">视图</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                  )}
                  {item.status && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">状态</span>
                      <Badge
                        variant={
                          item.status === 'published'
                            ? 'default'
                            : item.status === 'draft'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {item.status === 'published'
                          ? '已发布'
                          : item.status === 'draft'
                          ? '草稿'
                          : item.status === 'archived'
                          ? '已归档'
                          : item.status}
                      </Badge>
                    </div>
                  )}
                  {item.size && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">大小</span>
                      <span className="font-medium">{formatFileSize(item.size)}</span>
                    </div>
                  )}
                  {item.updatedTimestamp && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">更新时间</span>
                      <span className="font-medium">
                        {formatDate(item.updatedTimestamp)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 底部信息和分页 */}
      <div className="relative flex items-center border-t bg-background px-4 py-3">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          已选择 {selectedIds.length} / {data.length} 项
          {total > 0 && ` · 共 ${total} 条数据`}
        </div>
        {onPageChange && total > pageSize && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <DataCardPagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date: string | number | undefined): string {
  if (!date) return '-';
  // 将字符串时间戳转换为数字
  const timestamp = typeof date === 'string' ? parseInt(date, 10) : date;
  // 检查是否为有效的时间戳
  if (isNaN(timestamp)) return '-';
  const d = new Date(timestamp);
  // 检查日期是否有效
  if (isNaN(d.getTime())) return '-';
  return format(d, 'yyyy-MM-dd HH:mm');
}

// 分页组件
interface DataCardPaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function DataCardPagination({
  currentPage,
  pageSize,
  total,
  onPageChange,
}: DataCardPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsisThreshold = 7;

    if (totalPages <= showEllipsisThreshold) {
      // 如果总页数少，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // 总是显示最后一页
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
