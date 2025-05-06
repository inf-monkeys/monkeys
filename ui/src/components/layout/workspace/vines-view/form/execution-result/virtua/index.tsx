import React, { createContext, forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { isUndefined } from 'lodash';
import { CustomContainerComponentProps, Virtualizer, VListHandle } from 'virtua';

import { useWorkflowExecutionList } from '@/apis/workflow/execution';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result';
import { useVinesExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result/use-vines-execution-result.ts';
import { IVinesExecutionResultItem, VirtuaExecutionResultGridItem } from '@/utils/execution.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';
import { mergeRefs } from '@/utils/merge-refs.ts';

const RefContext = createContext<React.RefCallback<Element>>(null!);
const Container = forwardRef<HTMLDivElement, CustomContainerComponentProps>((props, ref) => {
  const animationParent = useContext(RefContext);
  return <div ref={useMemo(() => mergeRefs([ref, animationParent]), [ref, animationParent])} {...props} />;
});
Container.displayName = 'VirtuaExecutionResultGridContainer';

interface IVirtuaExecutionResultGridProps {
  data: IVinesExecutionResultItem[][];

  isMiniFrame?: boolean;
  workflowId?: string | null;
  total: number;

  height: number;
}

export const VirtuaExecutionResultGrid: React.FC<IVirtuaExecutionResultGridProps> = ({
  data,
  total,
  isMiniFrame,
  workflowId,
  height,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [animationParent, enableAutoAnimate] = useAutoAnimate();
  const scrolling = useRef(false);

  const [page, setPage] = useState(1);
  const { data: remoteData, isLoading } = useWorkflowExecutionList(workflowId, page, LOAD_LIMIT, 0);
  const outputs = remoteData?.data ?? [];

  const loadedPagesRef = useRef<number[]>([1]);
  const loadedPageItemsLengthRef = useRef<number>(LOAD_LIMIT);
  const [list, setList] = useState<IVinesExecutionResultItem[][]>([]);

  // 使数据适配三列Grid
  const { conversionOutputs } = useVinesExecutionResult();
  useEffect(() => {
    if (isUndefined(remoteData) || loadedPagesRef.current.includes(page)) return;

    const resultList = conversionOutputs(outputs, isMiniFrame ? 2 : 3);
    if (resultList.length) {
      setList((prev) => prev.concat(resultList));
      loadedPagesRef.current.push(page);
      loadedPageItemsLengthRef.current += outputs.length;
    }
  }, [isMiniFrame, outputs, page]);

  const ref = useRef<VListHandle>(null);

  return (
    <RefContext.Provider value={animationParent}>
      <ScrollArea
        className={cn(
          '-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2',
          !total && 'hidden',
        )}
        ref={scrollRef}
        style={{ height }}
        disabledOverflowMask
      >
        <Virtualizer
          ref={ref}
          scrollRef={scrollRef}
          as={Container}
          onScroll={(offset) => {
            const prevScrolling = scrolling.current;
            scrolling.current = true;
            if (prevScrolling !== scrolling.current) {
              enableAutoAnimate(false);
            }
            if (!ref.current) return;

            // 检查是否滚动到底部
            if (offset - ref.current.scrollSize + ref.current.viewportSize >= -1.5 && !isLoading) {
              if (total > loadedPageItemsLengthRef.current && outputs.length === LOAD_LIMIT) {
                setPage((prev) => prev + 1);
              }
            }
          }}
          onScrollEnd={() => {
            scrolling.current = false;
            enableAutoAnimate(true);
          }}
          overscan={2}
        >
          {data.concat(list).map((it) => (
            <VirtuaExecutionResultGridItem
              data={it}
              key={it.map((i) => `${i.instanceId}-${i.render.index}`).join('-')}
              loadMore={() => {
                if (total > loadedPageItemsLengthRef.current && outputs.length === LOAD_LIMIT && !isLoading) {
                  setPage((prev) => prev + 1);
                }
              }}
              hasMore={total > loadedPageItemsLengthRef.current && outputs.length === LOAD_LIMIT}
              itemsPerPage={20}
            />
          ))}
        </Virtualizer>
      </ScrollArea>
    </RefContext.Provider>
  );
};
