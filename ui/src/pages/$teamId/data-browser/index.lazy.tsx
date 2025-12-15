import {
  getDataCategories,
  getDataList,
  getDataItem,
} from '@/apis/data-browser';
import { DataCardView } from '@/components/data-browser/data-card-view';
import { DataDetailPanel } from '@/components/data-browser/data-detail-panel';
import { DataSidebar } from '@/components/data-browser/data-sidebar';
import { DataTable } from '@/components/data-browser/data-table';
import { DataToolbar } from '@/components/data-browser/data-toolbar';
import type { DataCategory, DataItem } from '@/types/data';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/$teamId/data-browser/')({
  component: DataBrowserPage,
});

export function DataBrowserPage() {
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);

  // 加载视图数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 切换分类或搜索时重置状态
  useEffect(() => {
    setCurrentPage(1);
    setDataItems([]);
  }, [selectedCategory, searchKeyword]);

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

      // 解析 media 字段（如果是 JSON 字符串）
      const processedItems = response.items.map(item => {
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
      if (currentPage === 1) {
        setDataItems(processedItems);
      } else {
        setDataItems(prev => [...prev, ...processedItems]);
      }
      setTotal(response.total);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error(error.message || '加载数据失败');
      if (currentPage === 1) {
        setDataItems([]);
        setTotal(0);
      }
    } finally {
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
    setCurrentPage(1);
    setDataItems([]);
    loadDataList();
    loadCategories();
    toast.success('数据已刷新');
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

  return (
    <div className="absolute inset-0 flex h-full w-full overflow-hidden">
      {/* 左侧视图导航 - 只读模式，移除创建/更新/删除功能 */}
      <DataSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onRefresh={loadCategories}
        // 只读模式：不传递编辑相关的回调
        onCreateCategory={undefined}
        onUpdateCategory={undefined}
        onDeleteCategory={undefined}
      />

      {/* 右侧内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {viewingItem ? (
          /* 详情面板 */
          <DataDetailPanel item={viewingItem} onBack={handleBackToList} />
        ) : (
          <>
            {/* 工具栏 - 只读模式，移除导入/导出/批量删除功能 */}
            <DataToolbar
              selectedCount={0}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              // 只读模式：不传递编辑相关的回调
              onExport={undefined}
              onImport={undefined}
              onBatchDelete={undefined}
            />

            {/* 数据显示区域 */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'table' ? (
                <DataTable
                  data={dataItems}
                  isLoading={isLoading}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={handlePageChange}
                  onView={handleView}
                  // 只读模式：不传递编辑/删除功能
                  onEdit={undefined}
                  onDelete={undefined}
                  onSelectionChange={undefined}
                />
              ) : (
                <DataCardView
                  data={dataItems}
                  isLoading={isLoading}
                  selectedIds={[]}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={handlePageChange}
                  onView={handleView}
                  // 只读模式：不传递编辑/删除功能
                  onEdit={undefined}
                  onDelete={undefined}
                  onSelectionChange={undefined}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
