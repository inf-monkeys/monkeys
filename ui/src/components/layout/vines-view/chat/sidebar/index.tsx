import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { ChatSession } from '@/components/layout/vines-view/chat/sidebar/chat-session.tsx';
import { Button } from '@/components/ui/button';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cn, useLocalStorage } from '@/utils';

interface IChatSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ChatSidebar: React.FC<IChatSidebarProps> = () => {
  const { t } = useTranslation();

  const { workbenchVisible } = usePageStore();
  const { workflowId } = useFlowStore();
  const { data, mutate } = useWorkflowChatSessions(workflowId);
  const { trigger } = useCreateWorkflowChatSession();

  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const [visible, setVisible] = useState(!workbenchVisible);

  const activeSessionId = chatSessions[workflowId] ?? data?.[0]?.id;

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: visible ? 256 : 0, paddingRight: visible ? 4 : 0 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 6 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <h1 className="text-xl font-bold">{t('workspace.chat-view.sidebar.title')}</h1>
        <ScrollArea className="h-full max-h-[calc(100%-3rem)]">
          <div className="grid gap-2 py-1 pl-1 pr-3">
            {data?.map((session) => (
              <ChatSession
                active={activeSessionId === session.id}
                session={session}
                key={session.id}
                onDeleted={() => {
                  mutate().then((newData) => {
                    if (!newData?.length) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { [workflowId]: _, ...rest } = chatSessions;
                      setChatSessions(rest);
                    } else {
                      setChatSessions({
                        ...chatSessions,
                        [workflowId]: newData?.[0].id ?? '',
                      });
                    }
                  });
                }}
                onClick={() => {
                  setChatSessions({
                    ...chatSessions,
                    [workflowId]: session.id,
                  });
                }}
              />
            ))}

            <SimpleInputDialog
              title={t('workspace.chat-view.sidebar.create.label')}
              placeholder={t('workspace.chat-view.sidebar.create.placeholder')}
              onFinished={(displayName) =>
                toast.promise(trigger({ displayName, workflowId }), {
                  loading: t('workspace.chat-view.sidebar.create.loading'),
                  success: (session) => {
                    session &&
                      setChatSessions({
                        ...chatSessions,
                        [workflowId]: session.id,
                      });
                    return t('workspace.chat-view.sidebar.create.success');
                  },
                  error: t('workspace.chat-view.sidebar.create.error'),
                  finally: () => void mutate(),
                })
              }
            >
              <Button variant="outline" icon={<Plus />}>
                {t('workspace.chat-view.sidebar.create.label')}
              </Button>
            </SimpleInputDialog>
          </div>
        </ScrollArea>
      </motion.div>
      <Separator orientation="vertical" className="vines-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
              onClick={() => setVisible(!visible)}
            >
              <ChevronRight className={cn(visible && 'scale-x-[-1]')} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {visible ? t('workspace.chat-view.sidebar.collapse') : t('workspace.chat-view.sidebar.expand')}
          </TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
