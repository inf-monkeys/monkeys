import React from 'react';

import { isEmpty } from 'lodash';
import { StopCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { CleanMessages } from '@/components/layout/vines-view/chat/chat-bot/input/clean-messages.tsx';
import { useChat } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVinesChatInputProps {
  chatId: string;
  workflowId: string;
  multipleChat?: boolean;
  autoCreateSession?: boolean;
  setChatId?: (chatId: string) => void;
}

export const VinesChatInput: React.FC<IVinesChatInputProps> = ({
  chatId,
  workflowId,
  multipleChat = true,
  autoCreateSession = false,
  setChatId,
}) => {
  const { t } = useTranslation();

  const { messages, setMessages, input, setInput, handleEnterPress, isLoading, stop } = useChat({
    chatId,
  });

  const { mutate } = useWorkflowChatSessions(workflowId);
  const { trigger } = useCreateWorkflowChatSession();
  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const handleSend = () => {
    if (autoCreateSession) {
      toast.promise(trigger({ displayName: t('workspace.chat-view.sidebar.create.def-label'), workflowId }), {
        loading: t('workspace.chat-view.sidebar.create.loading'),
        success: (session) => {
          if (session) {
            const sessionId = session.id;
            setChatSessions({
              ...chatSessions,
              [workflowId]: sessionId,
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

  const isInputEmpty = isEmpty(input.trim());
  return (
    <div className="flex justify-between gap-2 py-2">
      {messages?.length > 0 && multipleChat && (
        <CleanMessages setMessages={setMessages}>
          <Button variant="outline" icon={<Trash2 />} />
        </CleanMessages>
      )}
      <Input
        placeholder={t('workspace.chat-view.chat-bot.chat.placeholder')}
        disabled={isLoading}
        value={input}
        onChange={setInput}
        onEnterPress={handleSend}
      />
      <Button variant="outline" loading={isLoading} disabled={isInputEmpty} onClick={handleSend}>
        {t('workspace.chat-view.chat-bot.chat.send')}
      </Button>
      {isLoading && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="[&_svg]:stroke-red-10" icon={<StopCircle />} onClick={stop} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.chat-view.chat-bot.chat.stop')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
