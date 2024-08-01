import { useCallback, useEffect, useRef, useState } from 'react';

import useSWR from 'swr';

import { isEmpty, omit } from 'lodash';
import { toast } from 'sonner';

import { nanoIdLowerCase } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';
import { parseOpenAIStream } from '@/utils/openai.ts';

import { ChatCompletionLog } from './messages/chat-message/tool-display';

export interface IVinesMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  extra?: ChatCompletionLog[];
  createdAt?: Date;
}

interface ChatOptions {
  chatId: string;

  model?: string;
  apiKey?: string;
  history?: IVinesMessage[];
  multipleChat?: boolean;

  extraBody?: Record<string, any>;

  initialInput?: string;
}

export const useChat = ({
  chatId,
  history,
  model,
  apiKey,
  multipleChat,
  initialInput = '',
  extraBody = {},
}: ChatOptions) => {
  const [initialMessagesFallback] = useState([]);
  const { data: messages, mutate } = useSWR<IVinesMessage[]>([chatId, 'messages'], null, {
    fallbackData: history ?? initialMessagesFallback,
  });
  const { data: isLoading = false, mutate: mutateLoading } = useSWR<boolean>([chatId, 'loading'], null);

  const { data: error = undefined, mutate: setError } = useSWR<undefined | Error>([chatId, 'error'], null);

  const { data: requestCredentials, mutate: mutateRequestCredentials } = useSWR<Record<string, any>>(
    [chatId, 'requestCredentials'],
    null,
    {
      fallbackData: {
        apiKey,
        model,
        multipleChat,
        extraBody,
      },
    },
  );

  useEffect(() => {
    const newCredentials: Record<string, any> = requestCredentials ?? {};
    if (apiKey) newCredentials.apiKey = apiKey;
    if (model) newCredentials.model = model;
    if (multipleChat) newCredentials.multipleChat = multipleChat;
    if (extraBody) newCredentials.extraBody = extraBody;

    void mutateRequestCredentials(newCredentials, false);
  }, [apiKey, multipleChat, extraBody, model]);

  const messagesRef = useRef<IVinesMessage[]>(messages || []);
  useEffect(() => {
    messagesRef.current = messages || [];
  }, [messages]);

  const chatIdRef = useRef(chatId);
  useEffect(() => {
    if (chatIdRef.current !== chatId) {
      chatIdRef.current = chatId;
    }
  }, [chatId]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const triggerRequest = useCallback(
    async (messages: IVinesMessage[]) => {
      try {
        void mutateLoading(true);
        void setError(void 0);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // region handle chat request
        const previousMessages = messagesRef.current;
        void mutate([...messages, { role: 'assistant', content: '' }], false);

        const finalMessages = messages.map((it) => omit(it, ['id', 'createdAt', 'extra'])).filter((it) => it.content);

        const finalMultipleChat = multipleChat ?? requestCredentials?.multipleChat;
        const finalChatId = chatIdRef.current;

        const teamId = localStorage.getItem('vines-team-id');

        const response = await fetch(`/v1/${finalMultipleChat ? 'chat/' : ''}completions`, {
          method: 'POST',
          body: stringify({
            model: model ?? requestCredentials?.model,
            [finalMultipleChat ? 'messages' : 'prompt']: finalMultipleChat
              ? finalMessages
              : messages.find((it) => it.role === 'user')?.content ?? '',
            stream: true,
            ...(extraBody ?? requestCredentials?.extraBody ?? {}),
            show_logs: true,
          }),
          headers: {
            Authorization: `Bearer ${apiKey ?? requestCredentials?.apiKey ?? ''}`,
            'Content-Type': 'application/json',
            ...(finalChatId && !finalChatId.startsWith('default-') && { 'x-monkeys-conversation-id': finalChatId }),
            ...(teamId && { 'x-monkeys-teamid': teamId }),
          },
          signal: abortController.signal,
        }).catch((err) => {
          mutate(previousMessages, false);
          throw err;
        });

        if (!response.ok) {
          void mutate(previousMessages, false);
          throw new Error((await response.text()) || 'Failed to fetch the chat response.');
        }

        if (!response.body) {
          throw new Error('The response body is empty.');
        }

        const data = parseOpenAIStream(response, finalMultipleChat)?.body;
        if (!data) {
          throw new Error('No data');
        }

        const reader = data.getReader();
        const decoder = new TextDecoder('utf-8');

        const assistantChatId = nanoIdLowerCase();
        const createdAt = new Date();
        let aiResult = '';
        const aiResultExtra: ChatCompletionLog[] = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (value) {
            const char = decoder.decode(value);
            try {
              const { content, type } = JSON.parse(char);

              if (type === 'text') {
                aiResult += content;
              } else {
                aiResultExtra.push(content);
              }
              void mutate(
                [
                  ...messages,
                  {
                    id: assistantChatId,
                    content: aiResult,
                    role: 'assistant',
                    createdAt,
                    extra: aiResultExtra,
                  },
                ],
                false,
              );
            } catch (e) {
              console.error(e);
              break;
            }
          }
          if (done) {
            break;
          }
        }
        // endregion

        abortControllerRef.current = null;
      } catch (err: any) {
        if ((err as any).name === 'AbortError') {
          toast.success('Conversation aborted by user');
          abortControllerRef.current = null;
          return null;
        }

        if (err.message?.includes('429')) {
          void setError(err as Error);
          toast.error('Too many requests. Please try again later.');
          return null;
        }

        void setError(err as Error);
        toast.error('Failed to fetch the chat response.Please check workflow logs.');
      } finally {
        void mutateLoading(false);

        const botMessage = messagesRef.current.at(-1);
        if (isEmpty(botMessage?.content?.trim() ?? '')) {
          toast.warning('No response to the conversation!');
        }
      }
    },
    [
      mutate,
      mutateLoading,
      setError,
      messagesRef,
      abortControllerRef,
      apiKey,
      model,
      chatId,
      multipleChat,
      requestCredentials,
    ],
  );

  const append = useCallback(
    async (message: IVinesMessage) => {
      if (!message.id) {
        message.id = nanoIdLowerCase();
      }

      return triggerRequest(messagesRef.current.concat(message as IVinesMessage));
    },
    [triggerRequest],
  );

  const reload = useCallback(async () => {
    if (messagesRef.current.length === 0) return null;

    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    if (lastMessage.role === 'assistant') {
      return triggerRequest(messagesRef.current.slice(0, -1));
    }

    return triggerRequest(messagesRef.current);
  }, [triggerRequest]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const setMessages = useCallback(
    (messages: IVinesMessage[]) => {
      void mutate(messages, false);
      messagesRef.current = messages;
    },
    [mutate],
  );

  const [input, setInput] = useState(initialInput);

  const handleEnterPress = useCallback(() => {
    if (!input) return;

    void append({
      content: input,
      role: 'user',
      createdAt: new Date(),
    });
    setInput('');
  }, [input, append]);

  return {
    messages: messages || [],
    error,
    append,
    reload,
    stop,
    setMessages,
    input,
    setInput,
    handleEnterPress,
    isLoading,
  };
};
