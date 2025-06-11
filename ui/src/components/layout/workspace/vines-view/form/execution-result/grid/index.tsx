import React, { Dispatch, SetStateAction, startTransition, useCallback, useEffect, useRef, useState } from 'react';

import { SWRInfiniteResponse } from 'swr/infinite';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { useInfiniteLoader, useMasonry, useResizeObserver } from 'masonic';

import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import useUrlState from '@/hooks/use-url-state';
import { usePageStore } from '@/store/usePageStore';
import { useLastScrollTop, useSetScrollTop } from '@/store/useScrollPositionStore';
import { useShouldFilterError } from '@/store/useShouldErrorFilterStore.ts';
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
const RETRY_LIMIT = 5;
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
  const retryRef = useRef(0);
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
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const isMiniFrame = mode === 'mini';
  const containerWidth =
    formContainerWidth * (isMiniFrame ? 1 : 0.6) - 16 - 16 - 4 - (isUseWorkSpace ? 140 : 0) - (isMiniFrame ? 12 : 0);
  const shouldFilterError = useShouldFilterError();
  const positioner = usePositioner(
    {
      width: containerWidth,
      columnGutter: 8,
      columnWidth: 200,
      rowGutter: 8,
      columnCount: isMiniFrame ? 2 : void 0,
    },
    [data.length, workflowId, shouldFilterError],
  );

  const resizeObserver = useResizeObserver(positioner);

  const { scrollTop, isScrolling, setScrollTop, currentScrollTopRef, lastUpdateTimeRef } = useScroller(
    scrollRef,
    workflowId ?? '',
  );

  const lastScrollTop = useLastScrollTop(workflowId ?? '');
  // useEffect(() => {});
  const addDeletedInstanceId = (instanceId: string) => {
    if (!deletedInstanceIdList.includes(instanceId))
      setDeletedInstanceIdList((prevState) => [...prevState, instanceId]);
  };
  const hasUsedCacheScrollTop = useRef(false);
  // useEffect(() => {
  // console.log('scrollTop', scrollTop);
  // console.log('container scrollTop', containerRef.current?.scrollTop);
  // }, [scrollTop]);
  // useEffect(() => {
  // console.log('last scrollTop', lastScrollTop);
  // }, [lastScrollTop]);
  useEffect(() => {
    // console.log('lastScrollTop', lastScrollTop);

    const tryRestorePosition = () => {
      startTransition(() => {
        // setIsScrolling(true);
        if (lastScrollTop && !hasUsedCacheScrollTop.current && retryRef.current < RETRY_LIMIT) {
          setScrollTop(lastScrollTop);
          currentScrollTopRef.current = lastScrollTop;
          scrollRef.current!.scrollTop = lastScrollTop;
          if (Math.abs(scrollRef.current!.scrollTop - lastScrollTop) > 20) {
            setTimeout(() => {
              retryRef.current++;
              // console.log('retryRef.current', retryRef.current);
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
  const masonryGrid = useMasonry<IVinesExecutionResultItem>({
    positioner,
    scrollTop,
    isScrolling,
    height: height === Infinity ? 800 : height,
    containerRef,
    items: data,
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
      className={cn('z-20 mr-0.5 bg-neocard [&>[data-radix-scroll-area-viewport]]:p-2')}
      ref={scrollRef}
      style={{ height: height === Infinity ? 800 : height }}
      disabledOverflowMask
    >
      <ErrorFilter />
      {/* <ExtraButtonFilter /> */}
      {masonryGrid}
    </ScrollArea>
  );
};

const useScroller = (scrollRef: React.RefObject<HTMLElement>, workflowId: string) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const setStoreScrollTop = useSetScrollTop();
  const lastScrollTop = useLastScrollTop(workflowId);
  const [scrollTop, setScrollTop] = useState(lastScrollTop ?? 0);
  const lastUpdateTimeRef = useRef(0);
  const currentScrollTopRef = useRef(lastScrollTop ?? 0);
  const frameRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const fps = 12; // 提高帧率以获得更流畅的滚动体验

  const throttledUpdate = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= 1000 / fps) {
        setScrollTop(currentScrollTopRef.current);
        setStoreScrollTop(workflowId, currentScrollTopRef.current);
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
  }, [workflowId, throttledUpdate]);

  return { scrollTop, isScrolling, setScrollTop, currentScrollTopRef, lastUpdateTimeRef, setIsScrolling };
};
