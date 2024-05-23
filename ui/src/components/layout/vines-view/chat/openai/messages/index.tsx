import React, { useEffect, useRef, useState } from 'react';

import { isEmpty } from 'lodash';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { AutoScroll } from '@/components/layout/vines-view/chat/messages/virtualized/auto-scroll.tsx';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/messages/virtualized/chat-message/real-time.tsx';
import { IMessage } from '@/components/layout/vines-view/chat/openai/use-chat.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn } from '@/utils';

interface IVirtualizedListProps {
  data: IMessage[];
  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
}

const EMPTY_CONTENT = String.fromCharCode(12288);

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
    <main className="relative flex h-full flex-col">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        context={{ virtuosoRef }}
        followOutput={'auto'}
        initialTopMostItemIndex={LastItemIndex}
        itemContent={(index: number, data: IMessage) => {
          const isUser = data.role === 'user';
          const content = data.content ?? '';
          const isEmptyMessage = isEmpty(content.trim());

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
                    <Card className="p-4 text-sm">{content}</Card>
                  </div>
                </div>
              ) : (
                <div className="group flex flex-row items-start gap-4">
                  <VinesIcon size="sm">{botPhoto}</VinesIcon>
                  <div
                    className={cn(
                      'flex max-w-[calc(100%-3rem)] flex-col gap-1',
                      isLoading && LastItemIndex === index && 'vines-result-streaming',
                    )}
                  >
                    <Card className="p-4 text-sm">
                      <VinesMarkdown allowHtml>{content}</VinesMarkdown>
                      {isEmptyMessage ? EMPTY_CONTENT : ''}
                    </Card>
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
