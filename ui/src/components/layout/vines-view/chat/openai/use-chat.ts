import { useCallback, useEffect, useRef, useState } from 'react';

import useSWR from 'swr';

import { useForceUpdate } from '@mantine/hooks';
import { isEmpty } from 'lodash';
import { toast } from 'sonner';

import { stringify } from '@/utils/fast-stable-stringify.ts';
import { parseOpenAIStream } from '@/utils/openai.ts';

export interface IMessage {
  content: string;
  role: 'user' | 'assistant';
}

export const useChat = (
  chatId: string,
  workflowId?: string,
  apiKey?: string,
  history?: IMessage[],
  multipleChat?: boolean,
) => {
  const [input, setInput] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const [messages, mutateMessages] = useState<IMessage[]>(history || []);

  const { data: isLoading = false, mutate: mutateLoading } = useSWR<boolean>([chatId, 'loading'], null);

  const messagesRef = useRef<IMessage[]>(messages || []);
  useEffect(() => {
    messagesRef.current = messages || [];
  }, [messages]);

  const setMessages = useCallback(
    async (messages: IMessage[]) => {
      mutateMessages(messages);
      messagesRef.current = messages;
    },
    [mutateMessages],
  );

  const handleSubmit = () => {
    mutateMessages([
      ...(multipleChat ? messagesRef.current : []),
      { content: input, role: 'user' },
      {
        content: '',
        role: 'assistant',
      },
    ]);
    setInput('');
  };

  const forceUpdate = useForceUpdate();

  const handleChat = useCallback(async () => {
    await mutateLoading(true);
    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await fetch(`/api/${multipleChat ? 'chat/' : ''}completions`, {
        method: 'POST',
        body: stringify({
          model: workflowId,
          [multipleChat ? 'messages' : 'prompt']: multipleChat
            ? messagesRef.current.filter((it) => it.content)
            : messagesRef.current.find((it) => it.role === 'user')?.content ?? '',
          stream: true,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(chatId && { 'x-monkeys-conversation-id': chatId }),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = parseOpenAIStream(response, multipleChat)?.body;
      if (!data) {
        throw new Error('No data');
      }

      const reader = data.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiResult = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          const char = decoder.decode(value);

          aiResult += char;
          const lastMessage = messagesRef.current.at(-1);
          if (!lastMessage) return;
          lastMessage.content = aiResult;
          mutateMessages(messagesRef.current);
          forceUpdate();
        }
        if (done) {
          break;
        }
      }

      // check if the bot message is empty
      const botMessage = messagesRef.current.at(-1);
      if (isEmpty(botMessage?.content?.trim() ?? '')) {
        mutateMessages((prev) => prev.slice(0, -1));
        toast.warning('对话未回应！');
      }

      await mutateLoading(false);
    } catch (error) {
      void mutateLoading(false);
      mutateMessages((prev) => {
        const prevMessage = prev.at(-1);
        if (prevMessage?.role === 'assistant' && isEmpty(prevMessage?.content?.trim() ?? '')) {
          return prev.slice(0, -1);
        }

        return prev;
      });

      // Ignore abort errors as they are expected.
      if ((error as any).name === 'AbortError') {
        toast.success('对话已停止');
        abortControllerRef.current = null;
        return null;
      }

      console.error(error);
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      toast.error('对话失败，请检查工作流日志');
    }
  }, [mutateMessages, chatId, apiKey, multipleChat, workflowId]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    stop,

    isLoading,

    handleSubmit,

    input,
    setInput,

    handleChat,
    setMessages,
  };
};
