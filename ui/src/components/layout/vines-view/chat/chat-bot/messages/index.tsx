import React, { useEffect, useRef, useState } from 'react';

import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { VinesChatMessage } from '@/components/layout/vines-view/chat/chat-bot/messages/chat-message/index.tsx';
import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { AutoScroll } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/auto-scroll.tsx';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/chat-message/real-time.tsx';

interface IVirtualizedListProps {
  data: IVinesMessage[];
  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
}

export const VirtualizedList: React.FC<IVirtualizedListProps> = ({ data, isLoading, userPhoto, botPhoto }) => {
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
    <main className="relative flex h-full flex-col [&>div]:overflow-x-hidden">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        context={{ virtuosoRef }}
        followOutput={'auto'}
        initialTopMostItemIndex={LastItemIndex}
        itemContent={(index: number, data: IVinesMessage) => {
          return (
            <VinesChatMessage
              index={index}
              LastItemIndex={LastItemIndex}
              data={data}
              isLoading={isLoading}
              botPhoto={botPhoto}
              userPhoto={userPhoto}
            />
          );
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
};

VirtualizedList.displayName = 'VinesOpenAIMessageVirtualizedList';
