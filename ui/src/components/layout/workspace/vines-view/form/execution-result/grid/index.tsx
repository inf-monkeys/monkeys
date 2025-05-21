import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { SWRInfiniteResponse } from 'swr/infinite';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { useInfiniteLoader, useMasonry, useResizeObserver } from 'masonic';

import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

import { ErrorFilter } from './error-filter';
import { ExecutionResultItem } from './item';
import { usePositioner } from './utils';

interface IExecutionResultGridProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowId: string | null;
  height: number;
  setPage: Dispatch<SetStateAction<number>>;
  data: IVinesExecutionResultItem[];
  hasMore: boolean;
  event$: EventEmitter<void>;
  mutate?: SWRInfiniteResponse['mutate'];
}

export type IAddDeletedInstanceId = (instanceId: string) => void;

export const ExecutionResultGrid: React.FC<IExecutionResultGridProps> = ({
  workflowId,
  height,
  setPage,
  data,
  hasMore,
  event$,
  mutate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formContainerWidth = usePageStore((s) => s.containerWidth);
  const { isUseWorkSpace } = useVinesRoute();

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

  const containerWidth = formContainerWidth * 0.6 - 16 - 16 - 4 - (isUseWorkSpace ? 140 : 0);

  const positioner = usePositioner(
    {
      width: containerWidth,
      columnGutter: 8,
      columnWidth: 200,
      rowGutter: 8,
    },
    [data.length, workflowId],
  );

  const resizeObserver = useResizeObserver(positioner);

  const { scrollTop, isScrolling } = useScroller(scrollRef);

  const addDeletedInstanceId = (instanceId: string) => {
    if (!deletedInstanceIdList.includes(instanceId))
      setDeletedInstanceIdList((prevState) => [...prevState, instanceId]);
  };

  const masonryGrid = useMasonry<IVinesExecutionResultItem>({
    positioner,
    scrollTop,
    isScrolling,
    height,
    containerRef,
    items: data ?? [],
    overscanBy: 3,
    render: useCallback(
      ({ data: item }) => (
        <ExecutionResultItem
          result={item}
          event$={event$}
          isDeleted={item.render.isDeleted || deletedInstanceIdList.includes(item.instanceId)}
          addDeletedInstanceId={addDeletedInstanceId}
          mutate={mutate}
        />
      ),
      [data, deletedInstanceIdList],
    ),
    itemKey: (item, index) => `${index}-${item.render.key}`,
    onRender: loadMore,
    itemHeightEstimate: 400,
    resizeObserver,
  });

  return (
    <ScrollArea
      className={cn('z-20 mr-0.5 bg-card-light dark:bg-card-dark [&>[data-radix-scroll-area-viewport]]:p-2')}
      ref={scrollRef}
      style={{ height }}
      disabledOverflowMask
    >
      <ErrorFilter />
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
