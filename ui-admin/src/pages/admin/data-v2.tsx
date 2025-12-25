import {
  batchDeleteDataItemsV2,
  createViewV2,
  deleteDataItemV2,
  deleteViewV2,
  getDataItemV2,
  getDataListV2,
  getDataNextPageV2,
  getViewTreeV2,
  listTagsV2,
  updateViewV2,
} from '@/apis/data-v2';
import { DataCardView } from '@/components/admin/data/data-card-view';
import { DataDetailPanel } from '@/components/admin/data/data-detail-panel';
import { DataTable } from '@/components/admin/data/data-table';
import { DataEditDialogV2 } from '@/components/admin/data-v2/data-edit-dialog';
import { DataSidebarV2 } from '@/components/admin/data-v2/data-sidebar';
import { DataToolbarV2 } from '@/components/admin/data-v2/data-toolbar';
import type { CreateViewDto, DataCategory, DataItem, DataTag, UpdateViewDto } from '@/types/data';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/data-v2')({
  component: DataManagementV2Page,
});

function normalizeMedia(item: DataItem): DataItem {
  if (typeof item.media === 'string' && item.media.trim().startsWith('[')) {
    try {
      return { ...item, media: JSON.parse(item.media) };
    } catch {
      return item;
    }
  }
  return item;
}

function DataManagementV2Page() {
  const [teamId, setTeamId] = useState('');
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<DataTag[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const nextPageTokenRef = useRef<string | null>(null);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const requestSeqRef = useRef(0);

  const setNextToken = (token: string | null) => {
    nextPageTokenRef.current = token;
  };

  useEffect(() => {
    if (!teamId) {
      setCategories([]);
      setAvailableTags([]);
      return;
    }
    void loadCategories(teamId);
    void loadTags(teamId);
  }, [teamId]);

  useEffect(() => {
    requestSeqRef.current += 1;
    setCurrentPage(1);
    setDataItems([]);
    setTotal(0);
    setHasMore(true);
    setNextToken(null);
    setSelectedIds([]);
  }, [teamId, selectedCategory, searchKeyword, selectedTagIds]);

  useEffect(() => {
    if (!teamId) return;
    void loadDataList();
  }, [teamId, selectedCategory, searchKeyword, selectedTagIds, currentPage]);

  const requireTeamId = () => {
    if (!teamId.trim()) {
      toast.error('请先填写团队 ID');
      return false;
    }
    return true;
  };

  const loadCategories = async (team: string) => {
    try {
      const data = await getViewTreeV2(team);
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || '加载视图失败');
      setCategories([]);
    }
  };

  const loadTags = async (team: string) => {
    try {
      const response = await listTagsV2({ teamId: team, limit: 200 });
      setAvailableTags(response.items || []);
    } catch (error: any) {
      toast.error(error.message || '加载标签失败');
      setAvailableTags([]);
    }
  };

  const loadDataList = async (options?: { forceFirstPage?: boolean }) => {
    if (!requireTeamId()) return;

    const requestSeq = (requestSeqRef.current += 1);
    setIsLoading(true);
    try {
      const effectivePage = options?.forceFirstPage ? 1 : currentPage;
      const tags = selectedTagIds.length > 0 ? selectedTagIds.join(',') : undefined;

      const commonParams = {
        teamId,
        viewId: selectedCategory || undefined,
        keyword: searchKeyword || undefined,
        tags,
        pageSize,
      };

      let items: DataItem[] = [];
      let token = '';
      let nextHasMore = true;

      if (effectivePage === 1) {
        const response = await getDataListV2({ ...commonParams, page: 1 });
        if (requestSeq !== requestSeqRef.current) return;
        items = response.items;
        token = response.nextPageToken || '';
        nextHasMore = !!token;
        setTotal(response.total || 0);
        setNextToken(token || null);
      } else {
        const response = await getDataNextPageV2({
          ...commonParams,
          pageToken: nextPageTokenRef.current || undefined,
        });
        if (requestSeq !== requestSeqRef.current) return;
        items = response.items;
        token = response.nextPageToken || '';
        nextHasMore = !!response.hasMore;
        setNextToken(token || null);
      }

      const processedItems = items.map((item) => normalizeMedia(item));

      if (effectivePage === 1) {
        setDataItems(processedItems);
        setHasMore(nextHasMore);
      } else {
        setDataItems((prev) => [...prev, ...processedItems]);
        setHasMore(nextHasMore);
      }
    } catch (error: any) {
      if (requestSeq !== requestSeqRef.current) return;
      toast.error(error.message || '加载数据失败');
      if (currentPage === 1) {
        setDataItems([]);
        setTotal(0);
        setHasMore(true);
      }
    } finally {
      if (requestSeq !== requestSeqRef.current) return;
      setIsLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    if (!requireTeamId()) return;
    requestSeqRef.current += 1;
    setCurrentPage(1);
    setDataItems([]);
    setTotal(0);
    setHasMore(true);
    setNextToken(null);
    void loadDataList({ forceFirstPage: true });
    void loadCategories(teamId);
    void loadTags(teamId);
    toast.success('数据已刷新');
  };

  const handleBatchDelete = async () => {
    if (!requireTeamId()) return;
    if (selectedIds.length === 0) return;
    try {
      await batchDeleteDataItemsV2(teamId, selectedIds);
      toast.success(`已删除 ${selectedIds.length} 条数据`);
      setSelectedIds([]);
      void loadDataList({ forceFirstPage: true });
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleDelete = async (item: DataItem) => {
    if (!item.id) {
      toast.error('无效的数据项');
      return;
    }
    if (!requireTeamId()) return;
    try {
      await deleteDataItemV2(teamId, item.id);
      toast.success('删除成功');
      setDataItems((prev) => prev.filter((x) => x.id !== item.id));
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleEdit = (item: DataItem) => {
    if (!item?.id) {
      toast.error('无效的数据项');
      return;
    }
    setEditingItemId(item.id);
    setEditDialogOpen(true);
  };

  const handleView = async (item: DataItem) => {
    if (!item?.id) {
      toast.error('无效的数据项');
      return;
    }
    if (!requireTeamId()) return;
    try {
      const fullItem = await getDataItemV2(teamId, item.id);
      if (fullItem) {
        setViewingItem(normalizeMedia(fullItem));
      } else {
        toast.error('获取详情失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取详情失败');
    }
  };

  const handleBackToList = () => {
    setViewingItem(null);
  };

  const handleCreateCategory = async (data: CreateViewDto & { tagIds?: string[] }) => {
    if (!requireTeamId()) return;
    try {
      await createViewV2(teamId, data);
      toast.success('创建成功');
      void loadCategories(teamId);
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  const handleUpdateCategory = async (categoryId: string, data: UpdateViewDto & { tagIds?: string[] }) => {
    if (!requireTeamId()) return;
    try {
      await updateViewV2(teamId, categoryId, data);
      toast.success('更新成功');
      void loadCategories(teamId);
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!requireTeamId()) return;
    try {
      await deleteViewV2(teamId, categoryId);
      toast.success('删除成功');
      if (selectedCategory === categoryId) {
        setSelectedCategory('');
      }
      void loadCategories(teamId);
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  return (
    <div className="flex h-full overflow-hidden min-h-0">
      <DataSidebarV2
        teamId={teamId}
        categories={categories}
        selectedCategory={selectedCategory}
        availableTags={availableTags}
        onSelectCategory={setSelectedCategory}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onRefresh={() => {
          if (!teamId) {
            toast.error('请先填写团队 ID');
            return;
          }
          void loadCategories(teamId);
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <DataEditDialogV2
          open={editDialogOpen}
          itemId={editingItemId}
          teamId={teamId}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingItemId(null);
          }}
          onSaved={(updated) => {
            setDataItems((prev) =>
              prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
            );
            if (viewingItem?.id === updated.id) {
              setViewingItem(updated);
            }
          }}
        />

        {viewingItem ? (
          <DataDetailPanel item={viewingItem} onBack={handleBackToList} />
        ) : (
          <>
            <DataToolbarV2
              teamId={teamId}
              onTeamIdChange={setTeamId}
              selectedCount={selectedIds.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              onBatchDelete={handleBatchDelete}
              tags={availableTags}
              selectedTagIds={selectedTagIds}
              onTagChange={setSelectedTagIds}
            />

            <div className="flex-1 overflow-hidden min-h-0">
              {viewMode === 'table' ? (
                <DataTable
                  data={dataItems}
                  isLoading={isLoading}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  hasMore={hasMore}
                  onPageChange={handlePageChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onSelectionChange={setSelectedIds}
                />
              ) : (
                <DataCardView
                  data={dataItems}
                  isLoading={isLoading}
                  selectedIds={selectedIds}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  hasMore={hasMore}
                  onPageChange={handlePageChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onSelectionChange={setSelectedIds}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
