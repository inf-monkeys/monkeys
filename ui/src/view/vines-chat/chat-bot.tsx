import React, { useEffect, useState } from 'react';

import { useDebounceEffect, useLatest } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty, reduce, toNumber } from 'lodash';
import { MessageSquareDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VinesChatInput } from 'src/components/layout/vines-view/chat/chat-bot/input';
import { VirtualizedList } from 'src/components/layout/vines-view/chat/chat-bot/messages';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { getVinesToken } from '@/apis/utils.ts';
import { useChatBotHistory, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { useChat } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';

interface IVinesChatModeProps {
  multipleChat?: boolean;
}

export const VinesChatMode: React.FC<IVinesChatModeProps> = ({ multipleChat }) => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

  const { userPhoto } = useVinesUser();

  const { vines } = useVinesFlow();

  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const { data: sessions } = useWorkflowChatSessions(workflowId);

  const [chatId, setChatId] = useState<string>('default');

  const forceUpdate = useForceUpdate();

  const currentSession = chatSessions?.[workflowId];
  useDebounceEffect(
    () => {
      if (sessions?.length) {
        if (!sessions?.find((it) => it.id === currentSession)) {
          setChatId(sessions[0].id);
          setChatSessions({
            ...chatSessions,
            [workflowId]: sessions[0].id,
          });
        } else {
          setChatId(currentSession);
        }
      } else {
        setChatSessions((prev) => {
          const { [workflowId]: _, ...rest } = prev;
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

  const extraBody = reduce(
    vines.workflowInput.filter((it) => it.default !== void 0 && !['stream', 'messages'].includes(it.name)),
    function (acc, curr) {
      acc[curr.name] = curr.type === 'number' ? toNumber(curr?.default) : curr.default;
      return acc;
    },
    {},
  );

  const { isLoading, setMessages, messages } = useChat({
    chatId,
    workflowId,
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

  return (
    <>
      <div className="size-full flex-1">
        <AnimatePresence>
          {isHistoryLoading ? (
            <motion.div
              key="vines-chat-loading"
              className="vines-center size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VinesLoading />
            </motion.div>
          ) : (
            <motion.div
              key="vines-chat-context"
              className="relative z-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <VirtualizedList
                data={messages ?? []}
                setMessages={setMessages}
                userPhoto={userPhoto}
                botPhoto={vines.workflowIcon}
                isLoading={isLoading}
              />
              {isEmptyMessages && (
                <motion.div
                  key="vines-chat-empty"
                  className="vines-center absolute left-0 top-0 size-full flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.2 } }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageSquareDashed size={64} />
                  <div className="mt-4 flex flex-col text-center">
                    <h2 className="font-bold">{t('workspace.chat-view.empty')}</h2>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="z-20">
        <VinesChatInput
          chatId={chatId}
          workflowId={workflowId}
          multipleChat={multipleChat}
          autoCreateSession={isDefaultSession}
          setChatId={setChatId}
        />
      </div>
    </>
  );
};
