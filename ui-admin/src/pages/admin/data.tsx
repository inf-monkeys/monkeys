import {
  batchDeleteDataItems,
  deleteDataItem,
  exportData,
  importData,
  getDataCategories,
  getDataList,
  createView,
  deleteView,
} from '@/apis/data';
import { DataSidebar } from '@/components/admin/data/data-sidebar';
import { DataTable } from '@/components/admin/data/data-table';
import { DataToolbar } from '@/components/admin/data/data-toolbar';
import type { DataCategory, DataExportOptions, DataItem, CreateViewDto } from '@/types/data';
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

  // 加载视图数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载数据列表
  useEffect(() => {
    loadDataList();
  }, [selectedCategory, searchKeyword]);

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
        page: 1,
        pageSize: 100,
      });
      setDataItems(response.items);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error(error.message || '加载数据失败');
      setDataItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
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
    toast.info(`查看: ${item.name}`);
    // TODO: 打开详情对话框
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
    <div className="flex h-full overflow-hidden">
      {/* 左侧视图导航 */}
      <DataSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        onRefresh={loadCategories}
      />

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 工具栏 */}
        <DataToolbar
          selectedCount={selectedIds.length}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onImport={handleImport}
          onBatchDelete={handleBatchDelete}
        />

        {/* 数据表格 */}
        <div className="flex-1 overflow-auto">
          <DataTable
            data={dataItems}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onSelectionChange={setSelectedIds}
          />
        </div>
      </div>
    </div>
  );
}
