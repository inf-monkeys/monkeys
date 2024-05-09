import { useCallback, useEffect, useRef, useState } from 'react';

import useSWR from 'swr';

import { useForceUpdate } from '@mantine/hooks';
import { toast } from 'sonner';

import { IMessage } from '@/components/layout/vines-view/chat/openai/chat-panel/index.tsx';
import { stringify } from '@/utils/fast-stable-stringify.ts';
import { parseOpenAIStream } from '@/utils/openai.ts';

export const useChat = (chatId: string, workflowId?: string, apiKey?: string, history?: IMessage[]) => {
  const [input, setInput] = useState('');
  const [controller, setController] = useState<AbortController | null>(null);

  const { data: messages, mutate } = useSWR<IMessage[]>([chatId, 'messages'], null, {
    fallbackData: history ?? [],
  });

  const { data: isLoading = false, mutate: mutateLoading } = useSWR<boolean>([chatId, 'loading'], null);

  const messagesRef = useRef<IMessage[]>(messages || []);
  useEffect(() => {
    messagesRef.current = messages || [];
  }, [messages]);

  const setMessages = useCallback(
    async (messages: IMessage[]) => {
      await mutate(messages, false);
      messagesRef.current = messages;
    },
    [mutate],
  );

  const handleSubmit = () => {
    void mutate(
      [
        ...messagesRef.current,
        { content: input, role: 'user' },
        {
          content: '',
          role: 'assistant',
        },
      ],
      false,
    );
    setInput('');
  };

  const forceUpdate = useForceUpdate();

  const handleChat = async () => {
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

      const data = parseOpenAIStream(response).body;
      if (!data) {
        throw new Error('No data');
      }

      const reader = data.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let aiResult = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const char = decoder.decode(value);

          aiResult += char;
          const lastMessage = messagesRef.current.at(-1);
          if (!lastMessage) return;
          lastMessage.content = aiResult;
          void mutate(messagesRef.current);
          forceUpdate();
        }
        done = readerDone;
      }

      await mutateLoading(false);
    } catch (error) {
      console.error(error);
      setController(null);
      void mutateLoading(false);
      toast.error('对话失败');
    }
  };

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
