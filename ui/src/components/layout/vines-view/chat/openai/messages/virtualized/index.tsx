import React, { useEffect, useRef, useState } from 'react';

import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { AutoScroll } from '@/components/layout/vines-view/chat/messages/virtualized/auto-scroll.tsx';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/messages/virtualized/chat-message/real-time.tsx';
import { IMessage } from '@/components/layout/vines-view/chat/openai/chat-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IVirtualizedListProps {
  data: IMessage[];
  userPhoto: string;
  botPhoto: string;
}

export const VirtualizedList: React.FC<IVirtualizedListProps> = ({ data, userPhoto, botPhoto }) => {
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
        itemContent={(_index: number, data: IMessage) => {
          const isUser = data.role === 'user';

          return (
            <div className="flex flex-col gap-6 py-4">
              {isUser ? (
                <div className="group flex w-full max-w-full flex-row-reverse gap-4">
                  <Avatar className="size-8 cursor-pointer">
                    <AvatarImage className="aspect-auto" src={userPhoto} alt={isUser ? 'user' : 'assistant'} />
                    <AvatarFallback className="rounded-none p-2 text-xs">
                      {isUser ? 'user' : 'assistant'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Card className="p-4 text-sm">{data.content}</Card>
                  </div>
                </div>
              ) : (
                <div className="group flex flex-row items-start gap-4">
                  <VinesIcon size="sm">{botPhoto}</VinesIcon>
                  <div className="flex flex-col gap-1">
                    <Card className="p-4">{data.content}</Card>
                  </div>
                </div>
              )}
            </div>
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
