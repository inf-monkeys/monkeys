import React, { useEffect, useState } from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty, reduce, toNumber } from 'lodash';
import { MessageSquareDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VinesChatInput } from 'src/components/layout/vines-view/chat/chat-bot/input';
import { VirtualizedList } from 'src/components/layout/vines-view/chat/chat-bot/messages';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { getVinesToken } from '@/apis/utils.ts';
import { useChatBotHistory } from '@/apis/workflow/chat';
import { useChat } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { useLocalStorage } from '@/utils';

interface IVinesChatModeProps {
  multipleChat?: boolean;
}

// million-ignore
export const VinesChatMode: React.FC<IVinesChatModeProps> = ({ multipleChat }) => {
  const { t } = useTranslation();

  const { workflowId } = useFlowStore();
  const { userPhoto } = useVinesUser();

  const { vines } = useVinesFlow();

  const [chatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});
  const [chatId, setChatId] = useState<string>('default');

  const forceUpdate = useForceUpdate();

  const currentSession = chatSessions?.[workflowId];
  useEffect(() => {
    if (currentSession) {
      setChatId(currentSession);
    } else {
      setChatId('default-' + workflowId);
    }
    forceUpdate();
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

  useEffect(() => {
    if (chatId === 'default' && !isLoading) {
      void setMessages([]);
    }
  }, [chatId]);

  const isEmptyMessages = !messages?.length;

  return (
    <>
      <header className="flex w-full justify-between pb-4 pl-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">
            {t(`workspace.chat-view.chat-bot.title.${multipleChat ? 'multiple' : 'single'}`)}
          </h1>
          {chatId === 'default' && (
            <span className="text-xs opacity-70">{t('workspace.chat-view.chat-bot.temporary-mode')}</span>
          )}
        </div>
      </header>
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
              <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
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
                userPhoto={userPhoto}
                botPhoto={vines.workflowIcon}
                isLoading={isLoading}
              />
              {isEmptyMessages && (
                <motion.div
                  key="vines-chat-empty"
                  className="vines-center absolute left-0 top-0 size-full flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
      <VinesChatInput chatId={chatId} multipleChat={multipleChat} />
    </>
  );
};
