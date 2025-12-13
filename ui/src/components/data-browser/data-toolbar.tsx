import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';
import type { DataExportOptions } from '@/types/data';
import {
    Download,
    FileJson,
    FileSpreadsheet,
    FileText,
    LayoutGrid,
    MoreHorizontal,
    RefreshCw,
    Search,
    Table,
    Trash2,
    Upload,
    Edit2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DataToolbarProps {
  selectedCount?: number;
  viewMode?: 'table' | 'card';
  onViewModeChange?: (mode: 'table' | 'card') => void;
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
  onExport: (options: DataExportOptions) => void;
  onImport: (file: File) => void;
  onBatchDelete?: () => void;
  onBatchUpdateStatus?: (status: 'draft' | 'published' | 'archived') => void;
}

export function DataToolbar({
  selectedCount = 0,
  viewMode = 'table',
  onViewModeChange,
  onSearch,
  onRefresh,
  onExport,
  onImport,
  onBatchDelete,
  onBatchUpdateStatus,
}: DataToolbarProps) {
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    onSearch(searchKeyword);
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    onExport({ format });
    toast.success(`正在导出 ${format.toUpperCase()} 文件...`);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImport(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      {/* 左侧：搜索和刷新 */}
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索数据..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 批量操作 */}
        {selectedCount > 0 && (
          <>
            {/* 批量编辑状态 */}
            {onBatchUpdateStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-2 h-4 w-4" />
                    批量编辑 ({selectedCount})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>更改状态</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBatchUpdateStatus('draft')}>
                    设为草稿
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBatchUpdateStatus('published')}>
                    设为已发布
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBatchUpdateStatus('archived')}>
                    设为已归档
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* 批量删除 */}
            {onBatchDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBatchDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除 ({selectedCount})
              </Button>
            )}
          </>
        )}

        {/* 视图切换 */}
        {onViewModeChange && (
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none border-0"
              onClick={() => onViewModeChange('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none border-0"
              onClick={() => onViewModeChange('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 导入 */}
        <Button variant="outline" size="sm" onClick={handleImportClick}>
          <Upload className="mr-2 h-4 w-4" />
          导入
        </Button>

        {/* 导出下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>导出格式</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className="mr-2 h-4 w-4" />
              CSV 文件
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <FileJson className="mr-2 h-4 w-4" />
              JSON 文件
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel 文件
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 更多操作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>更多操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              批量编辑
            </DropdownMenuItem>
            <DropdownMenuItem>
              数据统计
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
