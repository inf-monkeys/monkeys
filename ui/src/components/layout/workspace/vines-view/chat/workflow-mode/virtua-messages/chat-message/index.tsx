import React, { memo } from 'react';

import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { IVinesChatListItem } from '@/components/layout/workspace/vines-view/chat/workflow-mode/typings.ts';
import { VinesBotChatMessage } from '@/components/layout/workspace/vines-view/chat/workflow-mode/virtua-messages/chat-message/bot.tsx';
import { WorkflowInputList } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils';

interface IVinesChatMessageProps {
  data: IVinesChatListItem;
  isLast?: boolean;
  useSimple?: boolean;
}

export const ChatMessage = memo<IVinesChatMessageProps>(({ data, isLast = false, useSimple = false }) => {
  const { t } = useTranslation();

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
  const isRUNNING = ['RUNNING', 'PAUSED'].includes(status ?? '');

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="group flex w-full max-w-full flex-row-reverse gap-4">
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="-mt-5 ml-12 flex flex-col gap-1">
          <span className="text-end text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
            {startTime}
          </span>
          <Card className={cn('p-4 text-sm', hasInput && 'min-w-80')}>
            {hasInput ? (
              <WorkflowInputList
                inputs={inputs}
                defaultValueText=""
                disabledTypeTag
                cardClassName="p-0 border-transparent shadow-transparent"
              />
            ) : hasOriginalInput ? (
              <VinesHighlighter language="json">{JSON.stringify(originalInput, null, 2)}</VinesHighlighter>
            ) : (
              t('workspace.chat-view.workflow-mode.manually-trigger')
            )}
          </Card>
        </div>
      </div>
      <VinesBotChatMessage
        status={status}
        botPhoto={botPhoto}
        endTime={endTime}
        instanceId={instanceId}
        className={isRUNNING && isLast && !useSimple ? 'hidden' : ''}
        useSimple={useSimple}
      >
        {useSimple ? (
          isRUNNING ? (
            <div className="vines-center w-full">
              <VinesLoading size="md" />
            </div>
          ) : (
            <VinesAbstractDataPreview data={finalData} />
          )
        ) : (
          <VinesAbstractDataPreview data={finalData} />
        )}
      </VinesBotChatMessage>
    </div>
  );
});

ChatMessage.displayName = 'VinesMessageItem';
