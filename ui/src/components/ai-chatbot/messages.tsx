import { memo } from 'react';

import type { UseChatHelpers } from '@ai-sdk/react';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';

import { Greeting } from './greeting';
import { useMessages } from './hooks/use-messages';
import { PreviewMessage, ThinkingMessage } from './message';
import { ChatMessage } from './typings';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({ chatId, status, messages, setMessages, regenerate, isReadonly }: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div ref={messagesContainerRef} className="relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-4">
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
        />
      ))}

      {status === 'submitted' && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <ThinkingMessage />
      )}

      <motion.div
        ref={messagesEndRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return false;
});
