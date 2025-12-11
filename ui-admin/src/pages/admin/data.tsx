import {
  batchDeleteDataItems,
  deleteDataItem,
  exportData,
  importData
} from '@/apis/data';
import { DataSidebar } from '@/components/admin/data/data-sidebar';
import { DataTable } from '@/components/admin/data/data-table';
import { DataToolbar } from '@/components/admin/data/data-toolbar';
import type { DataCategory, DataExportOptions, DataItem } from '@/types/data';
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

  // 加载分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载数据列表
  useEffect(() => {
    loadDataList();
  }, [selectedCategory, searchKeyword]);

  const loadCategories = async () => {
    try {
      // 模拟数据，实际应该从 API 获取
      const mockCategories: DataCategory[] = [
        {
          id: 'user',
          name: '用户数据',
          children: [
            { id: 'user-basic', name: '基础信息' },
            { id: 'user-profile', name: '用户档案' },
            { id: 'user-activity', name: '活动记录' },
          ],
        },
        {
          id: 'workflow',
          name: '工作流数据',
          children: [
            { id: 'workflow-templates', name: '工作流模板' },
            { id: 'workflow-executions', name: '执行记录' },
          ],
        },
        {
          id: 'system',
          name: '系统数据',
          children: [
            { id: 'system-config', name: '系统配置' },
            { id: 'system-logs', name: '系统日志' },
          ],
        },
      ];
      setCategories(mockCategories);
      // const data = await getDataCategories();
      // setCategories(data);
    } catch (error: any) {
      toast.error(error.message || '加载分类失败');
    }
  };

  const loadDataList = async () => {
    setIsLoading(true);
    try {
      // 模拟数据，实际应该从 API 获取
      const mockData: DataItem[] = [
        {
          id: '1',
          name: '用户注册数据',
          category: selectedCategory || 'user-basic',
          type: 'JSON',
          size: 1024 * 500,
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T15:30:00Z',
          description: '用户注册时的基础信息数据',
        },
        {
          id: '2',
          name: '工作流执行日志',
          category: selectedCategory || 'workflow-executions',
          type: 'CSV',
          size: 1024 * 1024 * 2,
          status: 'active',
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-01-22T09:15:00Z',
        },
        {
          id: '3',
          name: '系统配置备份',
          category: selectedCategory || 'system-config',
          type: 'JSON',
          size: 1024 * 256,
          status: 'archived',
          createdAt: '2024-01-05T12:00:00Z',
          updatedAt: '2024-01-18T14:20:00Z',
        },
        {
          id: '4',
          name: '用户活动追踪',
          category: selectedCategory || 'user-activity',
          type: 'Database',
          size: 1024 * 1024 * 50,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-23T16:45:00Z',
        },
      ];

      // 根据搜索关键词过滤
      const filteredData = searchKeyword
        ? mockData.filter((item) =>
            item.name.toLowerCase().includes(searchKeyword.toLowerCase())
          )
        : mockData;

      setDataItems(filteredData);

      // const response = await getDataList({
      //   category: selectedCategory,
      //   keyword: searchKeyword,
      // });
      // setDataItems(response.items);
    } catch (error: any) {
      toast.error(error.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleRefresh = () => {
    loadDataList();
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧分类导航 */}
      <DataSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
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
