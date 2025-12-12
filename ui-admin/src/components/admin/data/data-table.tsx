import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { DataItem } from '@/types/data';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import * as React from 'react';

interface DataTableProps {
  data: DataItem[];
  isLoading?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (item: DataItem) => void;
  onDelete?: (item: DataItem) => void;
  onView?: (item: DataItem) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataTable({
  data,
  isLoading,
  currentPage = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<DataItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            名称
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = (row.getValue('type') as string) || row.original.assetType;
        if (!type) return '-';
        return (
          <Badge variant="secondary">
            {String(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'category',
      header: '视图',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        if (!status) return '-';
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
          published: 'default',
          draft: 'secondary',
          archived: 'outline',
        };
        const labels: Record<string, string> = {
          published: '已发布',
          draft: '草稿',
          archived: '已归档',
        };
        return (
          <Badge variant={variants[status] || 'secondary'}>
            {labels[status] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'size',
      header: '大小',
      cell: ({ row }) => {
        const size = row.getValue('size') as number | undefined;
        if (!size) return '-';
        return formatFileSize(size);
      },
    },
    {
      accessorKey: 'updatedTimestamp',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            更新时间
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const updatedTimestamp = row.getValue('updatedTimestamp') as string | number | undefined;
        if (!updatedTimestamp) return '-';
        // 将字符串时间戳转换为数字
        const timestamp = typeof updatedTimestamp === 'string' ? parseInt(updatedTimestamp, 10) : updatedTimestamp;
        if (isNaN(timestamp)) return '-';
        const date = new Date(timestamp);
        // 检查日期是否有效
        if (isNaN(date.getTime())) return '-';
        return format(date, 'yyyy-MM-dd HH:mm');
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const item = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
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
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  // 通知父组件选择变化
  React.useEffect(() => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id)
      .filter((id): id is string => !!id);

    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, onSelectionChange]);

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
      <div className="flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 bg-background z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-9 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-3"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 align-middle [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-3"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部信息和分页 */}
      <div className="relative flex items-center border-t bg-background px-4 py-3">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          已选择 {table.getFilteredSelectedRowModel().rows.length} / {data.length} 项
          {total > 0 && ` · 共 ${total} 条数据`}
        </div>
        {onPageChange && total > pageSize && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <DataTablePagination
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
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 分页组件
interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function DataTablePagination({
  currentPage,
  pageSize,
  total,
  onPageChange,
}: DataTablePaginationProps) {
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
