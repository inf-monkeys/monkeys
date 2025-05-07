import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Masonry, useInfiniteLoader } from 'masonic';

import { useWorkflowExecutionList } from '@/apis/workflow/execution';
import { ExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/grid/item.tsx';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import {
  concatResultListReducer,
  convertExecutionResultToItemList,
  IVinesExecutionResultItem,
} from '@/utils/execution.ts';

interface IExecutionResultGridProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;

  workflowId?: string | null;
  height: number;

  page: number;
  setPage: Dispatch<SetStateAction<number>>;

  data: IVinesExecutionResultItem[];
  setData: Dispatch<SetStateAction<IVinesExecutionResultItem[]>>;
}

export const ExecutionResultGrid: React.FC<IExecutionResultGridProps> = ({
  event$,
  workflowId,
  height,
  page,
  setPage,
  data,
  setData,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const forceUpdate = useForceUpdate();
  const [renderKey, setRenderKey] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const containerWidth = usePageStore((s) => s.containerWidth);

  event$.useSubscription(() => {
    forceUpdate();
    setRenderKey((prev) => prev + 1);
  });

  const { data: currentPageExecutionListData, isLoading } = useWorkflowExecutionList(workflowId, page, LOAD_LIMIT, 0);

  const maybeLoadMore = useInfiniteLoader(
    async () => {
      if (isLoading || !hasMore) return;

      console.log('触发加载更多，当前页：', page, '当前数据量：', data.length);
      setPage((prev) => prev + 1);
    },
    {
      isItemLoaded: (index) => index < data.length,
      threshold: 3,
      // minimumBatchSize: LOAD_LIMIT / 2,
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

    if (page === 1) {
      return;
    }

    const nonExist = currentPageResultList.filter(
      (item) => !data.some((existingItem) => existingItem.instanceId === item.instanceId),
    );

    if (nonExist.length === 0) return;

    setData((prevData) => [...prevData, ...nonExist]);
    setRenderKey((prev) => prev + 1);
    event$.emit();
  }, [currentPageExecutionListData, page]);

  return (
    <ScrollArea
      className={cn('-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2')}
      ref={scrollRef}
      style={{ height }}
      disabledOverflowMask
    >
      <Masonry
        key={`${renderKey}-${data.length}`}
        items={data ?? []}
        ssrWidth={(containerWidth - 48) * 0.6 - 16}
        columnWidth={200}
        columnGutter={12}
        rowGutter={12}
        render={({ data: item, index }) => (
          <ExecutionResultItem index={index} key={`${item.render.key}-${index}`} {...item} />
        )}
        itemHeightEstimate={1}
        onRender={maybeLoadMore}
      />
    </ScrollArea>
  );
};
