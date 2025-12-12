import {
    batchDeleteDataItems,
    createView,
    deleteDataItem,
    deleteView,
    exportData,
    getDataCategories,
    getDataList,
    importData,
    updateView,
} from '@/apis/data';
import { DataCardView } from '@/components/admin/data/data-card-view';
import { DataDetailDialog } from '@/components/admin/data/data-detail-dialog';
import { DataSidebar } from '@/components/admin/data/data-sidebar';
import { DataTable } from '@/components/admin/data/data-table';
import { DataToolbar } from '@/components/admin/data/data-toolbar';
import type { CreateViewDto, DataCategory, DataExportOptions, DataItem, UpdateViewDto } from '@/types/data';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 加载视图数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载数据列表
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

  const loadDataList = async () => {
    setIsLoading(true);
    try {
      const response = await getDataList({
        viewId: selectedCategory || undefined,
        keyword: searchKeyword || undefined,
        page: currentPage,
        pageSize: pageSize,
      });
      setDataItems(response.items);
      setTotal(response.total);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error(error.message || '加载数据失败');
      setDataItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 搜索时重置到第一页
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadDataList();
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

  const handleDelete = async (item: DataItem) => {
    if (!item.id) {
      toast.error('无效的数据项');
      return;
    }
    try {
      await deleteDataItem(item.id);
      toast.success('删除成功');
      loadDataList();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleEdit = (item: DataItem) => {
    toast.info(`编辑: ${item.name}`);
    // TODO: 打开编辑对话框
  };

  const handleView = (item: DataItem) => {
    setViewingItem(item);
    setDetailDialogOpen(true);
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
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>
      </div>

      {/* 数据详情对话框 */}
      <DataDetailDialog
        item={viewingItem}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
