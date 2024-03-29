import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare } from 'lucide-react';

import { useWorkflowChatSessions } from '@/apis/workflow/chat';
import { Card } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IChatSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ChatSidebar: React.FC<IChatSidebarProps> = () => {
  const { workflowId } = usePageStore();
  const { data } = useWorkflowChatSessions(workflowId);

  const [visible, setVisible] = useState(true);

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-clip [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 256, paddingRight: 16 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <h1 className="text-2xl font-bold">对话列表</h1>
        <div className="grid gap-2">
          {data?.map((session) => (
            <Card
              key={session.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-10/5 active:bg-gray-10/10"
            >
              <MessageSquare size={16} />
              <span>{session.displayName}</span>
            </Card>
          ))}
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
          <TooltipContent>{visible ? '收起' : '展开'}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
