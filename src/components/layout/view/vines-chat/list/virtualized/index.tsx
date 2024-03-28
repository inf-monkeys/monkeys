import React, { memo, useEffect, useRef, useState } from 'react';

import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { IVinesChatListItem } from '@/components/layout/view/vines-chat/list/typings.ts';
import { AutoScroll } from '@/components/layout/view/vines-chat/list/virtualized/auto-scroll.tsx';
import { VirtualizedItem } from '@/components/layout/view/vines-chat/list/virtualized/item.tsx';

interface IVirtualizedListProps {
  data: IVinesChatListItem[];
}

export const VirtualizedList = memo<IVirtualizedListProps>(({ data }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ align: 'end', behavior: 'auto', index: 'LAST' });
    }
  }, []);

  const overScan = window.innerHeight;

  return (
    <main className="relative flex h-full flex-col">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        followOutput={'auto'}
        initialTopMostItemIndex={data?.length - 1}
        itemContent={VirtualizedItem}
        overscan={overScan}
        ref={virtuosoRef}
      />
      <AutoScroll
        atBottom={atBottom}
        onScrollToBottom={(type) => {
          const virtuoso = virtuosoRef.current;
          switch (type) {
            case 'auto': {
              virtuoso?.scrollToIndex({ align: 'end', behavior: 'auto', index: 'LAST' });
              break;
            }
            case 'click': {
              virtuoso?.scrollToIndex({ align: 'end', behavior: 'smooth', index: 'LAST' });
              break;
            }
          }
        }}
      />
    </main>
  );
});

VirtualizedList.displayName = 'VinesVirtualizedList';
