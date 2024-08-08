import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { Repeat2, Send, StopCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { CleanMessages } from '@/components/layout/workspace/vines-view/chat/chat-bot/input/clean-messages.tsx';
import { useChat } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSubmitHandler } from '@/hooks/use-submit-handler.ts';

interface IVinesChatInputProps {
  chatId: string;
  id: string;
  multipleChat?: boolean;
  autoCreateSession?: boolean;
  setChatId?: (chatId: string) => void;
}

export const VinesChatInput: React.FC<IVinesChatInputProps> = ({
  chatId,
  id,
  multipleChat = true,
  autoCreateSession = false,
  setChatId,
}) => {
  const { t } = useTranslation();

  const { messages, setMessages, input, setInput, handleEnterPress, isLoading, stop, reload } = useChat({
    chatId,
  });

  const { mutate } = useWorkflowChatSessions(id);
  const { trigger } = useCreateWorkflowChatSession();
  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const handleSend = () => {
    if (autoCreateSession) {
      toast.promise(trigger({ displayName: t('workspace.chat-view.sidebar.create.def-label'), workflowId: id }), {
        loading: t('workspace.chat-view.sidebar.create.loading'),
        success: (session) => {
          if (session) {
            const sessionId = session.id;
            setChatSessions({
              ...chatSessions,
              [id]: sessionId,
            });

            setChatId?.(sessionId);
          }

          setTimeout(() => handleEnterPress(), 80);

          return t('workspace.chat-view.sidebar.create.success');
        },
        error: t('workspace.chat-view.sidebar.create.error'),
        finally: () => void mutate(),
      });
    } else {
      handleEnterPress();
    }
  };

  const { submitKey, shouldSubmit } = useSubmitHandler();

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (e.key === 'ArrowUp' && input.length <= 0 && !(e.metaKey || e.altKey || e.ctrlKey)) {
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e)) {
      handleSend();
      e.preventDefault();
    }
  };

  const isInputEmpty = isEmpty(input.trim());
  const hasMessages = messages?.length > 0;

  return (
    <div className="space-y-1.5 pb-1">
      <div className="flex items-center gap-2">
        {hasMessages && (
          <>
            {multipleChat && (
              <CleanMessages setMessages={setMessages}>
                <Button className="!p-1.5 [&>div>svg]:size-3" variant="outline" icon={<Trash2 size={10} />} />
              </CleanMessages>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="!p-1.5 [&>div>svg]:size-3"
                  variant="outline"
                  icon={<Repeat2 size={10} />}
                  onClick={reload}
                />
              </TooltipTrigger>
              <TooltipContent>{t('workspace.chat-view.chat-bot.resend-latest-message')}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      <div className="relative overflow-hidden">
        <AutosizeTextarea
          onKeyDown={onInputKeyDown}
          placeholder={t('workspace.chat-view.chat-bot.chat.placeholder')}
          maxHeight={150}
          minHeight={80}
          value={input}
          onChange={(val) => setInput(val.target.value)}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <span className="pointer-events-none z-0 select-none text-xs text-opacity-50">
            {t('workspace.chat-view.chat-bot.chat.tips', { submitKey })}
          </span>
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                key="vines-chat-mode-stop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  size="small"
                  variant="outline"
                  className="text-red-10 [&_svg]:stroke-red-10"
                  icon={<StopCircle />}
                  onClick={stop}
                >
                  {t('workspace.chat-view.chat-bot.chat.stop')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="vines-chat-mode-send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="small"
                  icon={<Send />}
                  loading={isLoading}
                  disabled={isInputEmpty}
                  onClick={handleSend}
                >
                  {t('workspace.chat-view.chat-bot.chat.send')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
