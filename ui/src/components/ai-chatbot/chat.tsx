import { useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { nanoid } from 'nanoid';

import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';
import { ChatMessage } from './typings';

export function Chat({ id, isReadonly }: { id: string; isReadonly: boolean }) {
  const { messages, setMessages, status, regenerate, sendMessage, stop } = useChat<ChatMessage>({
    id,
    experimental_throttle: 100,
    generateId: () => nanoid(),
    transport: new DefaultChatTransport({
      api: '/api/ai-chatbot',
      fetch,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: 'gpt-4o-mini',
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {},
    onFinish: () => {},
    onError: (error) => {},
  });

  const [input, setInput] = useState<string>('');

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <Messages
        chatId={id}
        status={status}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        isReadonly={isReadonly}
        isArtifactVisible={false}
      />

      <form className="mx-auto flex w-full gap-2 md:max-w-3xl">
        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            status={status}
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            stop={stop}
          />
        )}
      </form>
    </div>
  );
}
