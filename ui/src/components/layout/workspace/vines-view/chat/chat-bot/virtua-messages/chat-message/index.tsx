import React from 'react';

import _, { isEmpty } from 'lodash';

import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { ToolDisplay } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages/chat-message/tool-display.tsx';
import { MessageToolbar } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages/chat-message/toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn } from '@/utils';

interface IVinesChatMessageProps {
  data: IVinesMessage;
  index: number;
  LastItemIndex: number;

  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;

  setMessageByIndex: (index: number, message?: Partial<IVinesMessage>) => void;
  resend: (index?: number) => void;
}

const EMPTY_CONTENT = String.fromCharCode(12288);

export const VinesChatMessage: React.FC<IVinesChatMessageProps> = ({
  data,
  setMessageByIndex,
  index,
  LastItemIndex,
  isLoading,
  botPhoto,
  userPhoto,
  resend,
}) => {
  const isUser = data.role === 'user';
  const content = data.content ?? '';
  const isTextContent = _.isString(content);
  const isEmptyMessage = isEmpty(isTextContent ? content.trim() : content.length);
  const textContent = isTextContent
    ? content
    : content
        .map((item) => {
          switch (item.type) {
            case 'text':
              return item.text;
            case 'image_url':
              return `![${item.image_url.url}](${item.image_url.url})`;
          }
        })
        .join('\n');

  const extra = data.extra;

  return (
    <div className="flex flex-col gap-6 py-4">
      {isUser ? (
        <div className="group flex w-full max-w-full flex-row-reverse gap-4">
          <Avatar className="size-8 cursor-pointer">
            <AvatarImage className="aspect-auto" src={userPhoto} alt={isUser ? 'user' : 'assistant'} />
            <AvatarFallback className="rounded-none p-2 text-xs">{isUser ? 'user' : 'assistant'}</AvatarFallback>
          </Avatar>
          <div className="flex-full flex max-w-[calc(100%-5rem)] items-end">
            <MessageToolbar
              className="-mr-3 ml-0"
              setMessageByIndex={setMessageByIndex}
              resend={resend}
              content={textContent}
              messageIndex={index}
            />
            <Card className="p-4 text-sm">
              <VinesMarkdown className="max-w-full">{textContent}</VinesMarkdown>
            </Card>
          </div>
        </div>
      ) : (
        <div className="group flex flex-row items-start gap-4">
          <VinesIcon size="sm">{botPhoto}</VinesIcon>
          <div className="flex w-full max-w-[calc(100%-5rem)] items-end">
            <Card className="relative p-4 text-sm">
              <ToolDisplay data={extra} />
              <VinesMarkdown
                className={cn('max-w-full', isLoading && LastItemIndex === index ? 'vines-result-streaming' : '')}
              >
                {content + (isEmptyMessage ? EMPTY_CONTENT : '')}
              </VinesMarkdown>
            </Card>
            <MessageToolbar
              setMessageByIndex={setMessageByIndex}
              resend={resend}
              content={textContent}
              messageIndex={index}
            />
          </div>
        </div>
      )}
    </div>
  );
};
