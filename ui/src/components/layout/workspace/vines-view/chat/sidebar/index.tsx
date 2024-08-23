import React from 'react';

import { motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { ChatSession } from '@/components/layout/workspace/vines-view/chat/sidebar/chat-session.tsx';
import { WorkflowChatViewOptions } from '@/components/layout/workspace/vines-view/chat/sidebar/options.tsx';
import { Button } from '@/components/ui/button';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

interface IChatSidebarProps {
  id: string;

  className?: string;

  sidebarVisible: boolean;

  side?: 'left' | 'right';
  isWorkflowMode?: boolean; // !!! 只能给工作流模式使用
}

export const ChatSidebar: React.FC<IChatSidebarProps> = ({
  className,
  id,
  sidebarVisible,
  isWorkflowMode,
  side = 'left',
}) => {
  const { t } = useTranslation();

  const { data, mutate } = useWorkflowChatSessions(id);
  const { trigger } = useCreateWorkflowChatSession();

  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const activeSessionId = chatSessions[id] ?? data?.[0]?.id;

  const hasDefaultSessions = data?.some(
    ({ displayName }) => displayName.startsWith('默认对话') || displayName.startsWith('Default Session'),
  );

  return (
    <motion.div
      className={cn(
        'flex h-full max-w-64 flex-col gap-2 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1',
        className,
      )}
      initial={{ width: sidebarVisible ? 256 : 0 }}
      animate={{
        width: sidebarVisible ? 256 : 0,
        ...(side === 'right' && {
          paddingLeft: sidebarVisible ? 16 : 0,
        }),
        transition: { duration: 0.2 },
      }}
    >
      <div className="flex w-full items-center justify-between pr-4">
        <h1 className="text-sm font-bold">{t('workspace.chat-view.sidebar.title')}</h1>
        {isWorkflowMode && <WorkflowChatViewOptions />}
      </div>
      <ScrollArea className="h-full">
        <div className="grid gap-2 py-1 pr-4">
          {isWorkflowMode && !hasDefaultSessions && (
            <ChatSession
              active={isEmpty(activeSessionId)}
              session={{ id: '', displayName: t('workspace.chat-view.sidebar.create.def-label') }}
              onClick={() => {
                setChatSessions({
                  ...chatSessions,
                  [id]: '',
                });
              }}
              disableDelete
            />
          )}
          {data?.map((session) => (
            <ChatSession
              active={activeSessionId === session.id}
              session={session}
              key={session.id}
              onDeleted={() => {
                mutate().then((newData) => {
                  if (!newData?.length) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { [id]: _, ...rest } = chatSessions;
                    setChatSessions(rest);
                  } else {
                    setChatSessions({
                      ...chatSessions,
                      [id]: newData?.[0].id ?? '',
                    });
                  }
                });
              }}
              onClick={() => {
                setChatSessions({
                  ...chatSessions,
                  [id]: session.id,
                });
              }}
            />
          ))}

          <SimpleInputDialog
            title={t('workspace.chat-view.sidebar.create.label')}
            placeholder={t('workspace.chat-view.sidebar.create.placeholder')}
            onFinished={(displayName) =>
              toast.promise(trigger({ displayName, workflowId: id }), {
                loading: t('workspace.chat-view.sidebar.create.loading'),
                success: (session) => {
                  session &&
                    setChatSessions({
                      ...chatSessions,
                      [id]: session.id,
                    });
                  return t('workspace.chat-view.sidebar.create.success');
                },
                error: t('workspace.chat-view.sidebar.create.error'),
                finally: () => void mutate(),
              })
            }
          >
            <Button variant="outline" icon={<Plus />} size="small">
              {t('workspace.chat-view.sidebar.create.label')}
            </Button>
          </SimpleInputDialog>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
