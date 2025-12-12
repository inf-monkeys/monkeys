import React, { Dispatch, SetStateAction, startTransition, useCallback, useEffect, useRef, useState } from 'react';

import { SWRInfiniteResponse } from 'swr/infinite';

import { useMemoizedFn } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { saveAs } from 'file-saver';
import { t } from 'i18next';
import JSZip from 'jszip';
import { get } from 'lodash';
import { Download, Square, SquareCheck } from 'lucide-react';
import { useInfiniteLoader, useMasonry, useResizeObserver } from 'masonic';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { extractVideoUrls } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils.ts';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import useUrlState from '@/hooks/use-url-state';
import { useOutputSelectionStore } from '@/store/useOutputSelectionStore';
import { usePageStore } from '@/store/usePageStore';
import { useLastScrollTop, useSetScrollTop } from '@/store/useScrollPositionStore';
import { useShouldFilterError } from '@/store/useShouldErrorFilterStore.ts';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';
import { mergeRefs } from '@/utils/merge-refs.ts';

import { ErrorFilter } from './error-filter';
import { ExecutionResultItem } from './item';
import { usePositioner } from './utils';

const EXECUTION_RESULT_FILTER_HEIGHT = 64;

interface IExecutionResultGridProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowId: string | null;
  height: number;
  setPage: Dispatch<SetStateAction<number>>;
  data: IVinesExecutionResultItem[];
  hasMore: boolean;
  event$: EventEmitter<void>;
  mutate?: SWRInfiniteResponse['mutate'];
  onSelectionChange?: (selectedItems: IVinesExecutionResultItem[]) => void;
}

export type IAddDeletedInstanceId = (instanceId: string) => void;
const RETRY_LIMIT = 5;
export const ExecutionResultGrid: React.FC<IExecutionResultGridProps> = ({
  workflowId,
  height,
  setPage,
  data,
  hasMore,
  event$,
  mutate,
  onSelectionChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: scrollViewportRef, width: scrollViewportWidth } = useElementSize<HTMLDivElement>();
  const mergedScrollRef = React.useMemo(
    () => mergeRefs([scrollRef, scrollViewportRef]),
    [scrollRef, scrollViewportRef],
  );
  const retryRef = useRef(0);
  const formContainerWidth = usePageStore((s) => s.containerWidth);
  const { isUseWorkSpace, isUseWorkbench } = useVinesRoute();
  const { isSelectionMode, setSelectionMode, selectedOutputs, toggleOutputSelection, clearSelection } =
    useOutputSelectionStore();
  const { data: associations } = useWorkflowAssociationList(workflowId);
  const { data: oem } = useSystemConfig();
  const pageFrom = useViewStore((s) => s.from);

  const selectionModeDisplayType =
    oem?.theme?.workflowPreviewExecutionGrid?.selectionModeDisplayType || 'dropdown-menu';
  const clickBehavior = oem?.theme?.workflowPreviewExecutionGrid?.clickBehavior || 'preview';
  const showErrorFilter = oem?.theme?.workflowPreviewExecutionGrid?.showErrorFilter ?? true;
  const isUniImagePreview = oem?.theme?.uniImagePreview ?? false;
  const oemOnlyResult = get(oem, 'theme.views.form.onlyResult', false);
  const displayType = get(oem, ['theme', 'workflowPreviewExecutionGrid', 'displayType'], 'masonry');
  const onlyResult = oemOnlyResult && pageFrom === 'workbench';

  const executionResultFilterHeight =
    showErrorFilter || selectionModeDisplayType === 'dropdown-menu' ? EXECUTION_RESULT_FILTER_HEIGHT : 30;

  useEffect(() => {
    if (onSelectionChange) {
      const selectedItemsList = data.filter((item) => selectedOutputs.has(item.instanceId));
      onSelectionChange(selectedItemsList);
    }
  }, [selectedOutputs, data, onSelectionChange]);

  // 批量下载选中的图片
  const handleBatchDownload = useMemoizedFn(async () => {
    // 从当前数据中筛选出选中的图片项
    const imageItems = data.filter(
      (item) =>
        selectedOutputs.has(item.render.key) &&
        item.render.type === 'image' &&
        item.render.status === 'COMPLETED' &&
        item.render.data,
    );

    if (imageItems.length === 0) {
      toast.error(t('workspace.form-view.execution-result.batch-download.no-images'));
      return;
    }

    const count = imageItems.length;

    toast.promise(
      async () => {
        // 创建 JSZip 实例
        const zip = new JSZip();

        // 并行下载所有图片并添加到 zip
        const downloadPromises = imageItems.map(async (item, index) => {
          const imageUrl = item.render.data as string;
          if (!imageUrl) return null;

          try {
            // 使用 fetch 获取图片数据
            const response = await fetch(imageUrl);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            const blob = await response.blob();

            // 从URL提取文件名,如果没有则使用默认名称
            const urlParts = imageUrl.split('/');
            let fileName = urlParts[urlParts.length - 1] || `image-${item.render.key}`;

            // 清理文件名中的查询参数
            fileName = fileName.split('?')[0];

            // 确保文件名有扩展名
            if (!fileName.includes('.')) {
              // 根据 blob type 确定扩展名
              const extension = blob.type.split('/')[1]?.split(';')[0] || 'png';
              fileName = `${fileName}.${extension}`;
            }

            // 添加到 zip 文件,使用索引前缀避免文件名冲突
            zip.file(`${String(index + 1).padStart(3, '0')}-${fileName}`, blob);
            return { success: true, index };
          } catch (error) {
            console.error(`下载图片失败: ${imageUrl}`, error);
            return { success: false, index, error };
          }
        });

        // 等待所有图片下载完成
        const results = await Promise.all(downloadPromises);

        // 检查是否有成功的下载
        const successCount = results.filter((r) => r?.success).length;
        if (successCount === 0) {
          throw new Error('所有图片下载失败');
        }

        // 生成 zip 文件
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // 生成文件名(包含时间戳)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const zipFileName = `images-${timestamp}.zip`;

        // 使用 file-saver 下载 zip 文件
        saveAs(zipBlob, zipFileName);

        // 下载完成后清空选中状态并退出选择模式
        clearSelection();
        setSelectionMode(false);

        // 如果有部分图片下载失败,在控制台输出警告
        const failedCount = results.filter((r) => r && !r.success).length;
        if (failedCount > 0) {
          console.warn(`${failedCount} 张图片下载失败,已成功打包 ${successCount} 张图片`);
        }
      },
      {
        success: t('workspace.form-view.execution-result.batch-download.success', { count }),
        error: t('workspace.form-view.execution-result.batch-download.error'),
        loading: t('workspace.form-view.execution-result.batch-download.loading', { count }),
      },
    );
  });

  const loadMore = useInfiniteLoader(
    async () => {
      if (!hasMore) return;
      setPage((prev) => prev + 1);
    },
    {
      threshold: LOAD_LIMIT * 2,
      minimumBatchSize: LOAD_LIMIT,
    },
  );

  const [deletedInstanceIdList, setDeletedInstanceIdList] = useState<string[]>([]);
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const isMiniFrame = mode === 'mini';
  const rawContainerWidth = onlyResult
    ? formContainerWidth - 64
    : formContainerWidth * (isMiniFrame ? 1 : 0.6) - 16 - 16 - 4 - (isUseWorkSpace ? 140 : 0) - (isMiniFrame ? 12 : 0);
  const enabledAssociationCount = associations?.filter((it) => it.enabled).length ?? 0;
  const hasAssociationSidebar = isUseWorkbench && enabledAssociationCount > 0;
  const normalizedContainerWidth = Number.isFinite(rawContainerWidth) ? rawContainerWidth : 0;
  const fallbackContainerWidth = Math.max(normalizedContainerWidth, 0);
  const viewportWidth = scrollViewportWidth || fallbackContainerWidth;
  const containerWidth = Math.max(0, viewportWidth - (hasAssociationSidebar ? 80 : 0));
  const shouldFilterError = useShouldFilterError();
  const positioner = usePositioner(
    {
      width:
        isUseWorkbench && (associations?.filter((it) => it.enabled).length ?? 0) > 0
          ? containerWidth - 80
          : containerWidth,
      columnGutter: 10,
      columnWidth: 160,
      rowGutter: 10,
      columnCount: isMiniFrame ? 2 : void 0,
    },
    [data.length, workflowId, shouldFilterError, displayType],
  );

  const resizeObserver = useResizeObserver(positioner);

  const { scrollTop, isScrolling, setScrollTop, currentScrollTopRef, lastUpdateTimeRef } = useScroller(
    scrollRef,
    workflowId ?? '',
  );

  const lastScrollTop = useLastScrollTop(workflowId ?? '');
  const addDeletedInstanceId = (instanceId: string) => {
    if (!deletedInstanceIdList.includes(instanceId))
      setDeletedInstanceIdList((prevState) => [...prevState, instanceId]);
  };
  const hasUsedCacheScrollTop = useRef(false);

  // 检测当前工作流是否为 POM 输出（任意结果包含 measurements_table 即视为 POM 工作流）
  const detectPomItem = useCallback((item: IVinesExecutionResultItem) => {
    const d: any = item?.render?.data as any;
    const payload = d && typeof d === 'object' ? (d.data ? d.data : d) : null;
    return !!(payload && Array.isArray(payload.measurements_table));
  }, []);

  const isPomWorkflow = React.useMemo(() => data.some((item) => detectPomItem(item)), [data, detectPomItem]);

  useEffect(() => {
    const tryRestorePosition = () => {
      startTransition(() => {
        if (lastScrollTop && !hasUsedCacheScrollTop.current && retryRef.current < RETRY_LIMIT) {
          setScrollTop(lastScrollTop);
          currentScrollTopRef.current = lastScrollTop;
          scrollRef.current!.scrollTop = lastScrollTop;
          if (Math.abs(scrollRef.current!.scrollTop - lastScrollTop) > 20) {
            setTimeout(() => {
              retryRef.current++;
              tryRestorePosition();
            }, 200);
          } else {
            lastUpdateTimeRef.current = Date.now();
            hasUsedCacheScrollTop.current = true;
          }
        }
      });
    };
    tryRestorePosition();
    return () => {
      hasUsedCacheScrollTop.current = false;
      retryRef.current = 0;
    };
  }, [lastScrollTop]);

  // 渲染执行结果项的通用组件
  const renderItem = useCallback(
    (item: IVinesExecutionResultItem) => (
      <ExecutionResultItem
        result={item}
        event$={event$}
        isDeleted={item.render.isDeleted || deletedInstanceIdList.includes(item.render.key)}
        addDeletedInstanceId={addDeletedInstanceId}
        mutate={mutate}
        isSelectionMode={isSelectionMode || clickBehavior === 'select'}
        isSelected={selectedOutputs.has(item.render.key)}
        onSelect={(id) => toggleOutputSelection(id, item)}
        clickBehavior={isUniImagePreview ? 'none' : clickBehavior}
        selectionModeDisplayType={selectionModeDisplayType}
        workflowId={workflowId ?? undefined}
        displayType={displayType}
        pomLayoutHint={isPomWorkflow}
      />
    ),
    [
      event$,
      deletedInstanceIdList,
      addDeletedInstanceId,
      mutate,
      isSelectionMode,
      clickBehavior,
      selectedOutputs,
      toggleOutputSelection,
      isUniImagePreview,
      selectionModeDisplayType,
      workflowId,
      displayType,
      isPomWorkflow,
    ],
  );

  // 瀑布流布局
  const masonryGrid = useMasonry<IVinesExecutionResultItem>({
    positioner,
    scrollTop,
    isScrolling,
    height: height === Infinity ? 800 - executionResultFilterHeight : height - executionResultFilterHeight,
    containerRef,
    items: data,
    overscanBy: 3,
    render: useCallback(({ data: item }) => renderItem(item), [renderItem]),
    // 使用稳定 key，避免滚动/插入导致卸载重挂（3D Canvas 会闪烁）
    itemKey: (item) => item.render.key || item.instanceId,
    onRender: loadMore,
    // POM 卡片包含大量测量数据的表格，需要更大的高度估算值避免重叠
    itemHeightEstimate: displayType === 'grid' ? 300 : isPomWorkflow ? 550 : 400,
    resizeObserver: displayType === 'masonry' ? resizeObserver : undefined,
  });

  // 为网格布局添加滚动监听，实现无限加载
  const handleGridScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const threshold = 200; // 距离底部200px时开始加载

      if (scrollHeight - scrollTop - clientHeight < threshold && hasMore) {
        loadMore(data.length - 1, data.length - 1, data);
      }
    },
    [hasMore, loadMore, data],
  );

  // 方形网格布局
  const renderGridLayout = useCallback(() => {
    const containerWidthValue =
      isUseWorkbench && (associations?.filter((it) => it.enabled).length ?? 0) > 0
        ? containerWidth - 80
        : containerWidth;

    const itemSize = 160;
    const gap = 10;
    const columnsCount = Math.floor((containerWidthValue + gap) / (itemSize + gap));

    const isVideoItem = (item: IVinesExecutionResultItem) => {
      if (item.render.type === 'video') return true;
      try {
        const d: any = item?.render?.data as any;
        const text = typeof d === 'string' ? d : JSON.stringify(d);
        return extractVideoUrls(text).length > 0;
      } catch {
        return false;
      }
    };

    const isPomItem = (item: IVinesExecutionResultItem) => {
      const d: any = item?.render?.data as any;
      const payload = d && typeof d === 'object' ? (d.data ? d.data : d) : null;
      const hasMeasurementsTable = !!(
        payload &&
        Array.isArray(payload.measurements_table) &&
        payload.measurements_table.length > 0
      );

      // 已经有测量表格输出的结果，直接按 POM 结果处理
      if (hasMeasurementsTable) return true;

      // 对于已识别为 POM 的工作流，为运行中 / 暂停中的 JSON 结果预留同样的布局空间，
      // 确保「运行中」卡片组与最终结果卡片组宽高保持一致
      if (
        isPomWorkflow &&
        item.render.type === 'json' &&
        ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(item.render.status)
      )
        return true;

      return false;
    };

    return (
      <div
        className="grid overflow-y-auto overflow-x-hidden"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, columnsCount)}, minmax(0, 1fr))`,
          padding: '8px',
          height: '100%',
          gap,
        }}
        onScroll={handleGridScroll}
      >
        {data.map((item, index) => {
          const isPom = isPomItem(item);
          const isVideo = isVideoItem(item);
          const span2 = isPom && columnsCount >= 2;
          return (
            <div
              key={`${index}-${item.render.key}`}
              className={cn(span2 && 'col-span-2', !isPom && !isVideo && 'aspect-square')}
              style={{ minHeight: isPom ? 320 : isVideo ? 0 : 200 }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    );
  }, [data, containerWidth, isUseWorkbench, associations, renderItem, handleGridScroll, isPomWorkflow]);

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between gap-2">
        {showErrorFilter && <ErrorFilter />}
        <div className="flex items-center gap-2">
          {isSelectionMode && selectedOutputs.size > 0 && (
            <Button
              variant="borderless"
              className="hover:bg-slate-1 active:bg-slate-1"
              icon={<Download />}
              onClick={handleBatchDownload}
            >
              {t('workspace.form-view.execution-result.batch-download.button', '批量下载')} ({selectedOutputs.size})
            </Button>
          )}
          {selectionModeDisplayType === 'dropdown-menu' && (
            <Button
              variant="borderless"
              className="hover:bg-slate-1 active:bg-slate-1"
              icon={isSelectionMode ? <SquareCheck /> : <Square />}
              onClick={() => setSelectionMode(!isSelectionMode)}
            >
              {t('workspace.form-view.execution-result.select-mode.title')}
            </Button>
          )}
        </div>
      </div>
      <ScrollArea
        className={cn(
          'z-20 mr-0.5 bg-neocard',
          displayType === 'grid'
            ? '[&>[data-radix-scroll-area-viewport]]:p-0'
            : '[&>[data-radix-scroll-area-viewport]]:p-2',
        )}
        ref={mergedScrollRef}
        style={{
          height: height === Infinity ? 800 - executionResultFilterHeight : height - executionResultFilterHeight,
        }}
        disabledOverflowMask
      >
        {displayType === 'grid' ? renderGridLayout() : masonryGrid}
      </ScrollArea>
    </div>
  );
};

const useScroller = (scrollRef: React.RefObject<HTMLElement>, workflowId: string) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const setStoreScrollTop = useSetScrollTop();
  const lastScrollTop = useLastScrollTop(workflowId);
  const [scrollTop, setScrollTopState] = useState(lastScrollTop ?? 0);
  const lastUpdateTimeRef = useRef(0);
  const currentScrollTopRef = useRef(lastScrollTop ?? 0);
  const frameRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const fps = 12; // 提高帧率以获得更流畅的滚动体验

  const setScrollTop = useCallback((value: number) => {
    setScrollTopState((prev) => {
      if (Math.abs(prev - value) < 0.5) {
        return prev;
      }
      return value;
    });
  }, []);

  const commitScrollPosition = useCallback(
    (value: number) => {
      setScrollTop(value);
      setStoreScrollTop(workflowId, value);
    },
    [setStoreScrollTop, workflowId, setScrollTop],
  );

  const throttledUpdate = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= 1000 / fps) {
        commitScrollPosition(currentScrollTopRef.current);
        lastUpdateTimeRef.current = now;
      }
      frameRef.current = null;
    });
  }, [fps, commitScrollPosition]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      currentScrollTopRef.current = scrollElement.scrollTop;
      setIsScrolling(true);
      throttledUpdate();

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(
        () => {
          setIsScrolling(false);
          commitScrollPosition(currentScrollTopRef.current);
        },
        100 + 1000 / fps,
      );
    };

    scrollElement.addEventListener('scroll', handleScroll);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [workflowId, throttledUpdate]);

  return { scrollTop, isScrolling, setScrollTop, currentScrollTopRef, lastUpdateTimeRef, setIsScrolling };
};
