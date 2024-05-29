import React, { useEffect, useRef, useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { isEmpty } from 'lodash';
import { Copy, CopyCheck } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { AutoScroll } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/auto-scroll.tsx';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/chat-message/real-time.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IVirtualizedListProps {
  data: IVinesMessage[];
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

  const clipboard = useClipboard();

  return (
    <main className="relative flex h-full flex-col">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        context={{ virtuosoRef }}
        followOutput={'auto'}
        initialTopMostItemIndex={LastItemIndex}
        itemContent={(index: number, data: IVinesMessage) => {
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
                  <Card className="relative max-w-[calc(100%-3rem)] p-4 text-sm">
                    <VinesMarkdown
                      className={isLoading && LastItemIndex === index ? 'vines-result-streaming' : ''}
                      allowHtml
                    >
                      {content + (isEmptyMessage ? EMPTY_CONTENT : '')}
                    </VinesMarkdown>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          icon={clipboard.copied ? <CopyCheck /> : <Copy />}
                          variant="outline"
                          size="small"
                          className="absolute -bottom-1 -right-9 flex scale-80 gap-2 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => clipboard.copy(content)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>复制</TooltipContent>
                    </Tooltip>
                  </Card>
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
