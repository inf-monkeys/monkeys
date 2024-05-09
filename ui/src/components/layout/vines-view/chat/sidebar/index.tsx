import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateWorkflowChatSession, useWorkflowChatSessions } from '@/apis/workflow/chat';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { ChatSession } from '@/components/layout/vines-view/chat/sidebar/chat-session.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFlowStore } from '@/store/useFlowStore';
import { cn, useLocalStorage } from '@/utils';

interface IChatSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ChatSidebar: React.FC<IChatSidebarProps> = () => {
  const { workflowId } = useFlowStore();
  const { data, mutate } = useWorkflowChatSessions(workflowId);
  const { trigger } = useCreateWorkflowChatSession();

  const [chatSessions, setChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const [visible, setVisible] = useState(false);

  const activeSessionId = chatSessions[workflowId] ?? data?.[0]?.id;

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-clip [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: visible ? 256 : 0, paddingRight: visible ? 16 : 0 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <h1 className="text-2xl font-bold">对话列表</h1>
        <div className="grid gap-2 px-1">
          {data?.map((session, i) => (
            <ChatSession
              active={activeSessionId === session.id}
              session={session}
              key={session.id}
              onDeleted={() => mutate()}
              onClick={() => {
                if (!i) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { [workflowId]: _, ...rest } = chatSessions;
                  setChatSessions(rest);
                } else {
                  setChatSessions({
                    ...chatSessions,
                    [workflowId]: session.id,
                  });
                }
              }}
            />
          ))}
          <InfoEditor
            title="新建会话"
            placeholder="输入会话名称，16 字以内"
            onFinished={(displayName) =>
              toast.promise(trigger({ displayName, workflowId }), {
                loading: '新建中...',
                success: (session) => {
                  session &&
                    setChatSessions({
                      ...chatSessions,
                      [workflowId]: session.id,
                    });
                  return '新建成功';
                },
                error: '新建失败',
                finally: () => void mutate(),
              })
            }
          >
            <Button variant="outline" icon={<Plus />}>
              新建会话
            </Button>
          </InfoEditor>
        </div>
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
          <TooltipContent>{visible ? '收起会话列表' : '展开会话列表'}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
