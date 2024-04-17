import React, { memo, useEffect, useRef, useState } from 'react';

import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { IVinesChatListItem } from '@/components/layout/vines-view/chat/messages/typings.ts';
import { AutoScroll } from '@/components/layout/vines-view/chat/messages/virtualized/auto-scroll.tsx';
import { ChatMessage } from '@/components/layout/vines-view/chat/messages/virtualized/chat-message';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/messages/virtualized/chat-message/real-time.tsx';

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

  const LastItemIndex = data.length - 1;

  return (
    <main className="relative flex h-full flex-col">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        context={{ virtuosoRef }}
        followOutput={'auto'}
        initialTopMostItemIndex={LastItemIndex}
        itemContent={(index: number, data: IVinesChatListItem) => {
          return <ChatMessage data={data} isLast={index === LastItemIndex} />;
        }}
        components={{
          Footer: VinesRealTimeChatMessage,
        }}
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
