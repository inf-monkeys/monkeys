import {
    batchDeleteDataItems,
    batchUpdateDataStatus,
    createView,
    deleteDataItem,
    deleteView,
    exportData,
    getDataCategories,
    getDataList,
    getDataNextPage,
    getDataItem,
    importData,
    setDataItemPinOrder,
    updateView,
} from '@/apis/data';
import { DataCardView } from '@/components/admin/data/data-card-view';
import { DataDetailPanel } from '@/components/admin/data/data-detail-panel';
import { DataEditDialog } from '@/components/admin/data/data-edit-dialog';
import { DataSidebar } from '@/components/admin/data/data-sidebar';
import { DataTable } from '@/components/admin/data/data-table';
import { DataToolbar } from '@/components/admin/data/data-toolbar';
import type { CreateViewDto, DataCategory, DataExportOptions, DataItem, UpdateViewDto } from '@/types/data';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/data')({
  component: DataManagementPage,
});

function DataManagementPage() {
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // 游标分页优化：记录最后一条数据的时间戳和 ID
  const [cursor, setCursor] = useState<{ timestamp?: number; pinOrder?: number; id?: string } | null>(null);
  // 请求序号：用于丢弃切换分类/搜索后返回的旧请求，避免旧数据污染当前视图
  const requestSeqRef = useRef(0);

  // 加载视图数据 - 只加载分类，数据列表由下面的 useEffect 加载
  useEffect(() => {
    loadCategories();
  }, []);

  // 切换分类或搜索时重置状态
  useEffect(() => {
    requestSeqRef.current += 1;
    setCurrentPage(1);
    setDataItems([]);
    setTotal(0);
    setHasMore(true);
    setCursor(null); // 重置游标
  }, [selectedCategory, searchKeyword]);

  // 加载数据列表 - 响应分类、搜索、分页变化
  useEffect(() => {
    loadDataList();
  }, [selectedCategory, searchKeyword, currentPage, pageSize]);

  const loadCategories = async () => {
    try {
      const data = await getDataCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('加载视图失败:', error);
      toast.error(error.message || '加载视图失败');
      // 使用空数据
      setCategories([]);
    }
  };

  const loadDataList = async (options?: { forceFirstPage?: boolean }) => {
    const requestSeq = (requestSeqRef.current += 1);
    setIsLoading(true);
    try {
      const effectivePage = options?.forceFirstPage ? 1 : currentPage;

      const commonParams = {
        viewId: selectedCategory || undefined,
        keyword: searchKeyword || undefined,
        pageSize,
      };

      let items: DataItem[] = [];
      let nextHasMore = true;
      let firstPageTotal: number | null = null;

      if (effectivePage === 1) {
        const response = await getDataList({ ...commonParams, page: 1 });
        if (requestSeq !== requestSeqRef.current) return;
        items = response.items;
        firstPageTotal = response.total;
        nextHasMore = items.length < response.total;
      } else {
        const response = await getDataNextPage({
          ...commonParams,
          cursorTimestamp: cursor?.timestamp,
          cursorPinOrder: cursor?.pinOrder,
          cursorId: cursor?.id,
        });
        if (requestSeq !== requestSeqRef.current) return;
        items = response.items;
        nextHasMore = response.hasMore;
      }

      // 解析 media 字段（如果是 JSON 字符串）
      const processedItems = items.map(item => {
        if (typeof item.media === 'string' && item.media.startsWith('[')) {
          try {
            item.media = JSON.parse(item.media);
          } catch (e) {
            // 如果解析失败，保持原样
            console.warn('Failed to parse media field:', item.media);
          }
        }
        return item;
      });

      // 如果是第一页，替换数据；否则追加数据（用于无限滚动）
      if (effectivePage === 1) {
        setDataItems(processedItems);
        // 原接口第一页返回 total（仍为“剩余数量”，但第一页即总数），用于展示总量
        setTotal(firstPageTotal || 0);
        setHasMore(nextHasMore);
      } else {
        setDataItems(prev => [...prev, ...processedItems]);
        setHasMore(nextHasMore);
      }

      // 更新游标：记录最后一条数据的时间戳和 ID
      if (processedItems.length > 0) {
        const lastItem = processedItems[processedItems.length - 1];
        setCursor({
          timestamp: lastItem.updatedTimestamp,
          pinOrder: lastItem.pinOrder ?? 0,
          id: lastItem.id,
        });
      }
    } catch (error: any) {
      if (requestSeq !== requestSeqRef.current) return;
      console.error('加载数据失败:', error);
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
    requestSeqRef.current += 1;
    setCurrentPage(1);
    setDataItems([]);
    setTotal(0);
    setHasMore(true);
    setCursor(null); // 重置游标
    void loadDataList({ forceFirstPage: true });
    loadCategories();
    toast.success('数据已刷新');
  };

  const handleExport = async (options: DataExportOptions) => {
    try {
      const blob = await exportData({
        ...options,
        category: selectedCategory,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${Date.now()}.${options.format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importData(file, selectedCategory);
      toast.success(
        `导入成功: ${result.success} 条成功, ${result.failed} 条失败`
      );
      loadDataList();
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await batchDeleteDataItems(selectedIds);
      toast.success(`已删除 ${selectedIds.length} 条数据`);
      setSelectedIds([]);
      loadDataList();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleBatchUpdateStatus = async (status: 'draft' | 'published' | 'archived') => {
    if (selectedIds.length === 0) return;

    try {
      await batchUpdateDataStatus(selectedIds, status);
      const statusLabels = {
        draft: '草稿',
        published: '已发布',
        archived: '已归档',
      };
      toast.success(`已将 ${selectedIds.length} 条数据设为${statusLabels[status]}`);
      setSelectedIds([]);
      loadDataList();
    } catch (error: any) {
      toast.error(error.message || '更新状态失败');
    }
  };

  const handleDelete = async (item: DataItem) => {
    if (!item.id) {
      toast.error('无效的数据项');
      return;
    }
    try {
      await deleteDataItem(item.id);
      toast.success('删除成功');

      // 立即从本地列表移除，避免等待重新拉取（尤其是无限滚动/大数据量时）
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

  const handlePinToggle = async (item: DataItem) => {
    if (!item?.id) {
      toast.error('无效的数据项');
      return;
    }

    try {
      const nextPinOrder = (item.pinOrder ?? 0) > 0 ? 0 : 1;
      await setDataItemPinOrder(item.id, nextPinOrder);
      toast.success(nextPinOrder > 0 ? '已置顶' : '已取消置顶');

      // 置顶会改变全局排序，直接回到第一页重载，确保结果一致
      requestSeqRef.current += 1;
      setCurrentPage(1);
      setDataItems([]);
      setCursor(null);
      void loadDataList({ forceFirstPage: true });
    } catch (error: any) {
      toast.error(error?.message || '置顶操作失败');
    }
  };

  const handleView = async (item: DataItem) => {
    try {
      // 获取完整的资产详情（包含 primaryContent 和 properties）
      const fullItem = await getDataItem(item.id!);
      if (fullItem) {
        setViewingItem(fullItem);
      } else {
        toast.error('获取详情失败');
      }
    } catch (error: any) {
      console.error('获取详情失败:', error);
      toast.error(error.message || '获取详情失败');
    }
  };

  const handleBackToList = () => {
    setViewingItem(null);
  };

  const handleCreateCategory = async (data: CreateViewDto) => {
    try {
      await createView(data);
      toast.success('创建成功');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  const handleUpdateCategory = async (categoryId: string, data: UpdateViewDto) => {
    try {
      await updateView(categoryId, data);
      toast.success('更新成功');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteView(categoryId);
      toast.success('删除成功');
      // 如果删除的是当前选中的视图，清空选择
      if (selectedCategory === categoryId) {
        setSelectedCategory('');
      }
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  return (
    <div className="flex h-full overflow-hidden min-h-0">
      {/* 左侧视图导航 */}
      <DataSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onRefresh={loadCategories}
      />

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <DataEditDialog
          open={editDialogOpen}
          itemId={editingItemId}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingItemId(null);
          }}
          onSaved={() => {
            // 编辑会更新 updatedTimestamp，排序可能发生变化；为确保列表一致，直接回到第一页重载
            requestSeqRef.current += 1;
            setCurrentPage(1);
            setDataItems([]);
            setCursor(null);
            void loadDataList({ forceFirstPage: true });
          }}
        />
        {viewingItem ? (
          /* 详情页面 */
          <DataDetailPanel item={viewingItem} onBack={handleBackToList} />
        ) : (
          <>
            {/* 工具栏 */}
            <DataToolbar
              selectedCount={selectedIds.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onImport={handleImport}
              onBatchDelete={handleBatchDelete}
              onBatchUpdateStatus={handleBatchUpdateStatus}
            />

            {/* 数据显示区域 */}
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
                  onPinToggle={handlePinToggle}
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
