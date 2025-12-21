import {
  getDataCategories,
  getDataList,
  getDataNextPage,
  getDataItem,
} from '@/apis/data-browser';
import { DataCardView } from '@/components/data-browser/data-card-view';
import { DataDetailPanel } from '@/components/data-browser/data-detail-panel';
import { DataSidebar } from '@/components/data-browser/data-sidebar';
import { DataTable } from '@/components/data-browser/data-table';
import { DataToolbar } from '@/components/data-browser/data-toolbar';
import type { DataCategory, DataItem } from '@/types/data';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
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
  const [hasMore, setHasMore] = useState(true);
  const [viewingItem, setViewingItem] = useState<DataItem | null>(null);
  // 游标分页优化：记录最后一条数据的时间戳和 ID
  const [cursor, setCursor] = useState<{ timestamp?: number; id?: string } | null>(null);
  // 请求序号：用于丢弃切换视图/搜索后返回的旧请求，避免旧数据污染新视图
  const requestSeqRef = useRef(0);

  // 加载视图数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 切换分类或搜索时重置状态
  useEffect(() => {
    // 立即使所有在途请求失效，避免旧请求在重置窗口内落盘到 state
    requestSeqRef.current += 1;
    setCurrentPage(1);
    setDataItems([]);
    setTotal(0);
    setHasMore(true);
    setCursor(null); // 重置游标
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
    setCursor(null); // 重置游标
    void loadDataList({ forceFirstPage: true });
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
                  hasMore={hasMore}
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
                  hasMore={hasMore}
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
