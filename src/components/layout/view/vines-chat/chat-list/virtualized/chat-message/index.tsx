import React, { memo } from 'react';

import { isEmpty } from 'lodash';

import { IVinesChatListItem } from '@/components/layout/view/vines-chat/chat-list/typings.ts';
import { VinesBotChatMessage } from '@/components/layout/view/vines-chat/chat-list/virtualized/chat-message/bot.tsx';
import { VinesAbstractDataPreview } from '@/components/layout/vines-execution/data-display/abstract';
import { WorkflowInputList } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { cn } from '@/utils';

export const ChatMessage = memo<{ data: IVinesChatListItem; isLast?: boolean }>(({ data, isLast = false }) => {
  const status = data.status;
  const instanceId = data.instanceId;
  const inputs = data.input;
  const originalInput = data.originalInput;
  const hasInput = inputs.length > 0;
  const hasOriginalInput = !isEmpty(originalInput);

  const botPhoto = data.botPhoto;
  const userPhoto = data.userPhoto;
  const userName = data.userName;

  const startTime = data.startTime;
  const endTime = data.endTime;

  const finalData = data.output as JSONValue;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="group flex w-full max-w-full flex-row-reverse gap-4">
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="-mt-5 flex flex-col gap-1">
          <span className="text-end text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
            {startTime}
          </span>
          <Card className={cn('p-4 text-sm', hasInput && 'min-w-80')}>
            {hasInput ? (
              <WorkflowInputList
                inputs={inputs}
                defaultValueText={''}
                cardClassName="p-0 border-transparent shadow-transparent"
              />
            ) : hasOriginalInput ? (
              <VinesHighlighter language="json">{JSON.stringify(originalInput, null, 2)}</VinesHighlighter>
            ) : (
              '手动或自动执行触发'
            )}
          </Card>
        </div>
      </div>
      <VinesBotChatMessage
        status={status}
        botPhoto={botPhoto}
        endTime={endTime}
        instanceId={instanceId}
        className={['RUNNING', 'PAUSED'].includes(status ?? '') && isLast ? 'hidden' : ''}
      >
        <VinesAbstractDataPreview data={finalData} />
      </VinesBotChatMessage>
    </div>
  );
});

ChatMessage.displayName = 'VinesMessageItem';
