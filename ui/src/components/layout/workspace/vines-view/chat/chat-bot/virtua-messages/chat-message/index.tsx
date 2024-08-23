import React from 'react';

import { isEmpty } from 'lodash';

import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { ToolDisplay } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages/chat-message/tool-display.tsx';
import { MessageToolbar } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages/chat-message/toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { VinesIcon } from '@/components/ui/vines-icon';

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
  const isEmptyMessage = isEmpty(content.trim());

  const extra = data.extra;

  return (
    <div className="flex flex-col gap-6 py-4">
      {isUser ? (
        <div className="group flex w-full max-w-full flex-row-reverse gap-4">
          <Avatar className="size-8 cursor-pointer">
            <AvatarImage className="aspect-auto" src={userPhoto} alt={isUser ? 'user' : 'assistant'} />
            <AvatarFallback className="rounded-none p-2 text-xs">{isUser ? 'user' : 'assistant'}</AvatarFallback>
          </Avatar>
          <div className="flex-full flex items-end">
            <MessageToolbar
              className="-mr-3 ml-0"
              setMessageByIndex={setMessageByIndex}
              resend={resend}
              content={content}
              messageIndex={index}
            />
            <Card className="p-4 text-sm">
              <VinesMarkdown>{content}</VinesMarkdown>
            </Card>
          </div>
        </div>
      ) : (
        <div className="group flex flex-row items-start gap-4">
          <VinesIcon size="sm">{botPhoto}</VinesIcon>
          <div className="flex w-full items-end">
            <Card className="relative max-w-[calc(100%-3rem)] p-4 text-sm">
              <ToolDisplay data={extra} />
              <VinesMarkdown className={isLoading && LastItemIndex === index ? 'vines-result-streaming' : ''} allowHtml>
                {content + (isEmptyMessage ? EMPTY_CONTENT : '')}
              </VinesMarkdown>
            </Card>
            <MessageToolbar
              setMessageByIndex={setMessageByIndex}
              resend={resend}
              content={content}
              messageIndex={index}
            />
          </div>
        </div>
      )}
    </div>
  );
};
