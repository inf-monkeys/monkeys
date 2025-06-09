import React, { useCallback, useEffect, useRef } from 'react';

import { Virtualizer, VListHandle } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import {
  IWorkbenchViewItemPage,
  IWorkbenchViewItemProps,
  ViewItem,
} from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { cn } from '@/utils';

interface IVirtuaWorkbenchViewListProps {
  height: number;
  data: IPinPage[];

  currentPageId?: string;
  currentGroupId?: string;

  onChildClick?: IWorkbenchViewItemProps['onClick'];
}

let timeoutId: NodeJS.Timeout;

export const VirtuaWorkbenchViewList: React.FC<IVirtuaWorkbenchViewListProps> = ({
  height,
  data,
  currentPageId,
  currentGroupId,
  onChildClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const ref = useRef<VListHandle>(null);
  const lastPageId = useRef<string>();
  useEffect(() => {
    if (!currentPageId || !currentGroupId || !ref.current) return;
    if (lastPageId.current === currentPageId) return;
    lastPageId.current = currentPageId;
    const index = data.findIndex((it) => it?.id === currentPageId);
    if (index === -1) return;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => ref.current?.scrollToIndex(index, { smooth: true, offset: -40 }), 100);
  }, [currentGroupId, currentPageId, data]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // timeoutId = setTimeout(() => ref.current?.scrollToIndex(index, { smooth: true, offset: -40 }), 10);
  }, []);
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  return (
    <ScrollArea
      className={cn('w-56 px-4 pt-4', onlyShowWorkbenchIcon && 'w-[4.80rem]')}
      ref={scrollRef}
      style={{ height }}
      disabledOverflowMask
      onScroll={handleScroll}
    >
      <Virtualizer ref={ref} scrollRef={scrollRef}>
        {data.map((it, i) => (
          <ViewItem
            key={i}
            page={it as IWorkbenchViewItemPage}
            onClick={onChildClick}
            onlyShowWorkbenchIcon={onlyShowWorkbenchIcon}
          />
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
