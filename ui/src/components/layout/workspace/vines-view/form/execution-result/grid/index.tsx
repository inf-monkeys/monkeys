import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { useInfiniteLoader, useMasonry, usePositioner, useResizeObserver } from 'masonic';

import { useWorkflowExecutionList } from '@/apis/workflow/execution';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import {
  concatResultListReducer,
  convertExecutionResultToItemList,
  IVinesExecutionResultItem,
} from '@/utils/execution.ts';

import { ExecutionResultItem } from './item';

interface IExecutionResultGridProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowId?: string | null;
  height: number;

  page: number;
  setPage: Dispatch<SetStateAction<number>>;

  data: IVinesExecutionResultItem[];
  setData: Dispatch<SetStateAction<IVinesExecutionResultItem[]>>;
}

export const ExecutionResultGrid: React.FC<IExecutionResultGridProps> = ({
  workflowId,
  height,
  page,
  setPage,
  data,
  setData,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasMore, setHasMore] = useState(true);
  const formContainerWidth = usePageStore((s) => s.containerWidth);

  const { data: currentPageExecutionListData, isLoading } = useWorkflowExecutionList(workflowId, page, LOAD_LIMIT, 0);

  const loadMore = useInfiniteLoader(
    async () => {
      if (isLoading || !hasMore) return;
      setPage((prev) => prev + 1);
    },
    {
      threshold: LOAD_LIMIT * 2,
      minimumBatchSize: LOAD_LIMIT,
    },
  );

  useEffect(() => {
    if (!currentPageExecutionListData) return;

    const currentPageResultList = currentPageExecutionListData.data
      .map(convertExecutionResultToItemList)
      .reduce(concatResultListReducer, []);

    if (currentPageResultList && currentPageResultList.length < LOAD_LIMIT) {
      setHasMore(false);
    }

    if (page === 1) return;

    const nonExist = currentPageResultList.filter(
      (item) => !data.some((existingItem) => existingItem.instanceId === item.instanceId),
    );

    if (nonExist.length === 0) return;

    setData((prevData) => [...prevData, ...nonExist]);
  }, [currentPageExecutionListData, page]);

  const containerWidth = (formContainerWidth - 48) * 0.6 - 16;

  const positioner = usePositioner({
    width: containerWidth,
    columnGutter: 12,
    columnWidth: 200,
    rowGutter: 12,
  });

  const resizeObserver = useResizeObserver(positioner);

  const { scrollTop, isScrolling } = useScroller(scrollRef);

  const masonryGrid = useMasonry<IVinesExecutionResultItem>({
    positioner,
    scrollTop,
    isScrolling,
    height,
    containerRef,
    items: data ?? [],
    overscanBy: 3,
    render: useCallback(({ data: item }) => <ExecutionResultItem {...item} />, []),
    itemKey: (item) => item.render.key,
    onRender: loadMore,
    itemHeightEstimate: 400,
    resizeObserver,
  });

  return (
    <ScrollArea
      className={cn('-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2')}
      ref={scrollRef}
      style={{ height }}
      disabledOverflowMask
    >
      {masonryGrid}
    </ScrollArea>
  );
};

const useScroller = (scrollRef: React.RefObject<HTMLElement>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const lastUpdateTimeRef = useRef(0);
  const currentScrollTopRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const fps = 12; // 提高帧率以获得更流畅的滚动体验

  const throttledUpdate = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= 1000 / fps) {
        setScrollTop(currentScrollTopRef.current);
        lastUpdateTimeRef.current = now;
      }
      frameRef.current = null;
    });
  }, [fps]);

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
          setScrollTop(currentScrollTopRef.current);
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
  }, [scrollRef, throttledUpdate]);

  return { scrollTop, isScrolling };
};
