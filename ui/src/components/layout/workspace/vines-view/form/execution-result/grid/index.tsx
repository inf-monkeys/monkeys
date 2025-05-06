import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import { Masonry, useInfiniteLoader } from 'masonic';

import { useWorkflowExecutionList } from '@/apis/workflow/execution';
import { ExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/grid/item.tsx';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import {
  concatResultListReducer,
  convertExecutionResultToItemList,
  IVinesExecutionResultItem,
} from '@/utils/execution.ts';
import { useForceUpdate } from '@/hooks/use-force-update.ts';

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

  const forceUpdate = useForceUpdate();

  const { data: currentPageExecutionListData, isLoading } = useWorkflowExecutionList(workflowId, page, LOAD_LIMIT, 0);

  const currentPageResultList = currentPageExecutionListData?.data
    .map(convertExecutionResultToItemList)
    .reduce(concatResultListReducer, []);

  const containerWidth = usePageStore((s) => s.containerWidth);

  const loader = () => {
    console.log('load more');
    if (isLoading || !currentPageResultList || (currentPageResultList && currentPageResultList.length < LOAD_LIMIT))
      return;

    setPage((prev) => prev + 1);
  };

  const infiniteLoader = useInfiniteLoader(loader, {
    // isItemLoaded: (index) => index < data.length,
  });

  useEffect(() => {
    const nonExist = currentPageResultList?.filter((c) => !data.map((p) => p.instanceId).includes(c.instanceId)) ?? [];

    if (nonExist.length == 0) return;

    console.log('pong', data, nonExist);

    setData((prevData) => {
      return [...prevData, ...nonExist];
    });

    forceUpdate();
  }, [currentPageResultList]);

  return (
    <ScrollArea
      className={cn('-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2')}
      ref={scrollRef}
      style={{ height }}
      disabledOverflowMask
    >
      <Masonry
        items={data ?? []}
        ssrWidth={(containerWidth - 48) * 0.6 - 16}
        columnWidth={200}
        columnGutter={12}
        rowGutter={12}
        render={({ data }) => {
          return <ExecutionResultItem key={data.render.key} {...data} />;
        }}
        itemHeightEstimate={160}
        onRender={infiniteLoader}
      />
    </ScrollArea>
  );
};
