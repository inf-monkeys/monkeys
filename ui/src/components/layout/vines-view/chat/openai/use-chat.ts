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

export const useChat = (chatId: string, workflowId?: string, apiKey?: string, history?: IMessage[]) => {
  const [input, setInput] = useState('');
  const [controller, setController] = useState<AbortController | null>(null);

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
      ...messagesRef.current,
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
      setController(controller);
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        body: stringify({
          model: workflowId,
          messages: messagesRef.current.filter((it) => it.content),
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

      const data = parseOpenAIStream(response)?.body;
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

      await mutateLoading(false);
    } catch (error) {
      console.error(error);
      setController(null);
      void mutateLoading(false);
      mutateMessages((prev) => {
        const prevMessage = prev.at(-1);
        if (prevMessage?.role === 'assistant' && isEmpty(prevMessage?.content?.trim() ?? '')) {
          return prev.slice(0, -1);
        }

        return prev;
      });
      toast.error('对话失败，请检查工作流日志');
    }
  }, [mutateMessages, chatId, apiKey]);

  return {
    messages,
    controller,

    isLoading,

    handleSubmit,

    input,
    setInput,

    handleChat,
    setMessages,
  };
};
