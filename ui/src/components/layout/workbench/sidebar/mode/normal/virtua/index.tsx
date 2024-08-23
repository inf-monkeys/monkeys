import React, { useEffect, useRef, useState } from 'react';

import { useCreation } from 'ahooks';
import { set } from 'lodash';
import { Virtualizer, VListHandle } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import {
  IWorkbenchViewItemPage,
  IWorkbenchViewItemProps,
  ViewItem,
  WorkbenchViewItemCurrentData,
  WorkbenchViewListStickyIndexContext,
  WorkbenchViewListStickyIndexesContext,
  WorkbenchViewListStickyItem,
} from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtuaWorkbenchViewListProps {
  height: number;
  data: { pages: IPinPage[]; id: string; displayName: string; isBuiltIn: boolean }[];

  currentPageId?: string;
  currentGroupId?: string;

  onChildClick?: IWorkbenchViewItemProps['onClick'];
}

export const VirtuaWorkbenchViewList: React.FC<IVirtuaWorkbenchViewListProps> = ({
  height,
  data,
  currentPageId,
  currentGroupId,
  onChildClick,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const [stickyIndexes, list] = useCreation(() => {
    const flatList = data
      .map((it) => [{ type: 'v-label', displayName: it.displayName }, ...it.pages.map((p) => set(p, 'groupId', it.id))])
      .flat() as IWorkbenchViewItemPage[];
    return [new Set(flatList.map(({ type }, i) => (type === 'v-label' ? i : -1)).filter((i) => i !== -1)), flatList];
  }, [data]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const ref = useRef<VListHandle>(null);
  useEffect(() => {
    if (!currentPageId || !currentGroupId || !ref.current) return;

    const index = list.findIndex((it) => it?.id === currentPageId && it.groupId === currentGroupId);
    if (index === -1) return;

    requestIdleCallback(() => ref.current?.scrollToIndex(index, { smooth: true, offset: -40 }));
  }, [currentGroupId, currentPageId, list]);

  return (
    <WorkbenchViewListStickyIndexContext.Provider value={activeIndex}>
      <WorkbenchViewListStickyIndexesContext.Provider value={stickyIndexes}>
        <WorkbenchViewItemCurrentData.Provider value={{ pageId: currentPageId, groupId: currentGroupId }}>
          <ScrollArea
            className="-mb-2 [&>[data-radix-scroll-area-viewport]]:-mt-2"
            ref={scrollRef}
            style={{ height: height + 8 }}
            disabledOverflowMask
          >
            <Virtualizer
              ref={ref}
              item={WorkbenchViewListStickyItem}
              keepMounted={[activeIndex]}
              onRangeChange={(start) => {
                const activeStickyIndex = [...stickyIndexes].reverse().find((index) => start >= index)!;
                setActiveIndex(activeStickyIndex);
              }}
              scrollRef={scrollRef}
            >
              {list.map((it, i) =>
                it.type === 'v-label' ? (
                  <div key={i} className="select-none bg-slate-1 py-2 pl-2">
                    <Label className="text-sm leading-none text-muted-foreground">{it.displayName}</Label>
                  </div>
                ) : (
                  <ViewItem key={i} page={it as IWorkbenchViewItemPage} onClick={onChildClick} />
                ),
              )}
              <div></div>
            </Virtualizer>
          </ScrollArea>
        </WorkbenchViewItemCurrentData.Provider>
      </WorkbenchViewListStickyIndexesContext.Provider>
    </WorkbenchViewListStickyIndexContext.Provider>
  );
};
