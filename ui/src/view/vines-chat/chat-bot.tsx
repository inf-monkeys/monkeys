/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import { useDebounceEffect, useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { MessageSquareDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { getVinesToken } from '@/apis/utils.ts';
import { useChatBotHistory, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { VinesChatInput } from '@/components/layout/workspace/vines-view/chat/chat-bot/input';
import { useChat } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { VirtuaChatBotMessages } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { DEFAULT_AGENT_ICON_URL } from '@/consts/icons.ts';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer.ts';

interface IVinesChatModeProps {
  multipleChat?: boolean;
  id: string;
  extraBody?: Record<string, any>;
  botPhoto?: string;
  height: number;
}

export const VinesChatMode: React.FC<IVinesChatModeProps> = ({
  multipleChat,
  id,
  extraBody,
  botPhoto = DEFAULT_AGENT_ICON_URL,
  height,
}) => {
  const { t } = useTranslation();

  const { userPhoto } = useVinesUser();

  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const { data: sessions } = useWorkflowChatSessions(id);

  const [chatId, setChatId] = useState<string>('default');

  const forceUpdate = useForceUpdate();

  const currentSession = chatSessions?.[id];
  useDebounceEffect(
    () => {
      if (sessions?.length) {
        if (!sessions?.find((it) => it.id === currentSession)) {
          setChatId(sessions[0].id);
          setChatSessions({
            ...chatSessions,
            [id]: sessions[0].id,
          });
        } else {
          setChatId(currentSession);
        }
      } else {
        setChatSessions((prev) => {
          const { [id]: _, ...rest } = prev;
          return rest;
        });
        setChatId('default');
      }
      forceUpdate();
    },
    [sessions],
    { wait: 80 },
  );

  const latestSessions = useLatest(sessions);
  useEffect(() => {
    if (latestSessions?.current?.find((it) => it.id === currentSession)) {
      setChatId(currentSession);
    }
  }, [currentSession]);

  const { data: apiKeys } = useApiKeyList();
  const vinesToken = getVinesToken();
  const apiKey = apiKeys?.find((key) => key.status === IApiKeyStatus.Valid)?.apiKey ?? vinesToken ?? '';

  const { data: history, error, isLoading: isHistoryLoading } = useChatBotHistory(chatId);

  const { isLoading, setMessages, messages, resend, input, setInput, handleEnterPress, stop, reload } = useChat({
    chatId,
    model: id,
    apiKey,
    history,
    multipleChat,
    extraBody,
  });

  useEffect(() => {
    if (!(error instanceof Error) && !isLoading) {
      void setMessages((history ?? []).filter((it) => !(it.role === 'assistant' && isEmpty(it.content))));
    }
  }, [history, error]);

  const isDefaultSession = chatId.startsWith('default');

  useEffect(() => {
    if (isDefaultSession && !isLoading) {
      void setMessages([]);
    }
  }, [chatId]);

  const isEmptyMessages = !messages?.length;

  const { ref: inputRef, height: wrapperHeight } = useElementSize();
  const [inputHeight, setInputHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setInputHeight(wrapperHeight);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <>
      <div className="size-full flex-1">
        <AnimatePresence>
          {isHistoryLoading ? (
            <div className="vines-center size-full">
              <VinesLoading />
            </div>
          ) : (
            <motion.div
              key="vines-chat-context"
              className="relative z-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
            >
              <VirtuaChatBotMessages
                data={messages ?? []}
                setMessages={setMessages}
                userPhoto={userPhoto}
                botPhoto={botPhoto}
                isLoading={isLoading}
                resend={resend}
                height={isEmptyMessages ? 0 : height - inputHeight}
              />
              {isEmptyMessages && (
                <motion.div
                  key="vines-chat-empty"
                  className="vines-center absolute left-0 top-0 size-full flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.4 } }}
                >
                  <MessageSquareDashed size={64} />
                  <div className="mt-2 flex flex-col text-center">
                    <h2 className="text-sm font-bold">{t('workspace.chat-view.empty')}</h2>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div ref={inputRef} className="z-20">
        <VinesChatInput
          id={id}
          multipleChat={multipleChat}
          autoCreateSession={isDefaultSession}
          setChatId={setChatId}
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          handleEnterPress={handleEnterPress}
          isLoading={isLoading}
          stop={stop}
          reload={reload}
        />
      </div>
    </>
  );
};
