import React, { useEffect, useRef, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { VinesChatMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { AutoScroll } from '@/components/layout/workspace/vines-view/chat/workflow-mode/messages/virtualized/auto-scroll.tsx';

interface IVirtualizedListProps {
  data: IVinesMessage[];
  setMessages: (messages: IVinesMessage[]) => void;
  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
  resend: (index?: number) => void;
}

export const VirtualizedList: React.FC<IVirtualizedListProps> = ({
  data,
  setMessages,
  isLoading,
  userPhoto,
  botPhoto,
  resend
}) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ align: 'end', behavior: 'auto', index: 'LAST' });
    }
  }, []);

  const handleSetMessageByIndex = useMemoizedFn((index: number, message?: Partial<IVinesMessage>) => {
    setMessages(
      data
        .map((it, i) => {
          if (index === i && message) {
            return { ...it, ...message };
          }
          return it;
        })
        .filter((_, i) => {
          return !(i === index && !message);
        }),
    );
  });

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
              setMessageByIndex={handleSetMessageByIndex}
              index={index}
              LastItemIndex={LastItemIndex}
              data={data}
              isLoading={isLoading}
              botPhoto={botPhoto}
              userPhoto={userPhoto}
              resend={resend}
            />
          );
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
