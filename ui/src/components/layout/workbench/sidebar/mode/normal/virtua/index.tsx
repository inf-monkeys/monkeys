import React, { useEffect, useRef } from 'react';

import { Virtualizer, VListHandle } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import {
  IWorkbenchViewItemPage,
  IWorkbenchViewItemProps,
  ViewItem,
  WorkbenchViewItemCurrentData,
} from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useOnlyShowWorkenchIcon } from '@/store/showWorkenchIcon';
import { cn } from '@/utils';

interface IVirtuaWorkbenchViewListProps {
  height: number;
  data: IPinPage[];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkenchIcon = useOnlyShowWorkenchIcon();
  const ref = useRef<VListHandle>(null);
  useEffect(() => {
    if (!currentPageId || !currentGroupId || !ref.current) return;

    const index = data.findIndex((it) => it?.id === currentPageId);
    if (index === -1) return;

    requestIdleCallback(() => ref.current?.scrollToIndex(index, { smooth: true, offset: -40 }));
  }, [currentGroupId, currentPageId, data]);

  return (
    <WorkbenchViewItemCurrentData.Provider value={{ pageId: currentPageId, groupId: currentGroupId }}>
      <ScrollArea
        className={cn('w-48 px-4 pt-4', onlyShowWorkenchIcon && 'w-[4.80rem]')}
        ref={scrollRef}
        style={{ height }}
        disabledOverflowMask
      >
        <Virtualizer ref={ref} scrollRef={scrollRef}>
          {data.map((it, i) => (
            <ViewItem
              key={i}
              page={it as IWorkbenchViewItemPage}
              onClick={onChildClick}
              onlyShowWorkenchIcon={onlyShowWorkenchIcon}
            />
          ))}
        </Virtualizer>
      </ScrollArea>
    </WorkbenchViewItemCurrentData.Provider>
  );
};
