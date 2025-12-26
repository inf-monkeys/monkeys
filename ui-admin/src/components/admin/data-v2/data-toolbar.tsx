import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataTag } from '@/types/data';
import { Filter, RefreshCw, Search, Table, LayoutGrid, Trash2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TagSelectorPanel } from './tag-selector-panel';

interface DataToolbarV2Props {
  teamId: string;
  onTeamIdChange: (teamId: string) => void;
  selectedCount?: number;
  viewMode?: 'table' | 'card';
  onViewModeChange?: (mode: 'table' | 'card') => void;
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
  onBatchDelete?: () => void;
  tags: DataTag[];
  selectedTagIds: string[];
  onTagChange: (next: string[]) => void;
}

export function DataToolbarV2({
  teamId,
  onTeamIdChange,
  selectedCount = 0,
  viewMode = 'table',
  onViewModeChange,
  onSearch,
  onRefresh,
  onBatchDelete,
  tags,
  selectedTagIds,
  onTagChange,
}: DataToolbarV2Props) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [teamInput, setTeamInput] = useState(teamId);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  useEffect(() => {
    setTeamInput(teamId);
  }, [teamId]);

  const applyTeamId = () => {
    onTeamIdChange(teamInput.trim());
  };

  const handleSearch = () => {
    onSearch(searchKeyword);
  };

  return (
    <div className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      {/* 左侧：Team + 搜索 + 刷新 */}
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Input
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyTeamId()}
            placeholder="Team ID"
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={applyTeamId}>
            <Check className="mr-2 h-4 w-4" />
            应用
          </Button>
        </div>

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索名称..."
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

      {/* 右侧：筛选 + 视图切换 + 批量 */}
      <div className="flex items-center gap-2">
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              筛选标签
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-2 py-0.5">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>筛选标签</DialogTitle>
              <DialogDescription>选择用于过滤资产的 Tag（与视图默认条件做 AND）。</DialogDescription>
            </DialogHeader>
            <TagSelectorPanel
              tags={tags}
              selectedIds={selectedTagIds}
              onChange={onTagChange}
              emptyText="暂无可用标签"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onTagChange([])}>
                清空
              </Button>
              <Button onClick={() => setTagDialogOpen(false)}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {selectedCount > 0 && onBatchDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBatchDelete}
            className={cn(selectedCount > 0 && 'animate-none')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除 ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
}
