import React from 'react';

import { MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useDeleteWorkflowChatSession } from '@/apis/workflow/chat';
import { IVinesChatSession } from '@/apis/workflow/chat/typings.ts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IChatSessionProps {
  session: IVinesChatSession;
  disableDelete?: boolean;
  onDeleted?: () => void;
}

export const ChatSession: React.FC<IChatSessionProps> = ({ session, disableDelete, onDeleted }) => {
  const { trigger } = useDeleteWorkflowChatSession(session._id);

  const sessionDisplayName = session.displayName;

  return (
    <Card className="group flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-10/5 active:bg-gray-10/10">
      <MessageSquare size={16} />
      <span>{sessionDisplayName}</span>
      <div
        className={cn(
          'flex flex-1 justify-end opacity-0 transition-opacity group-hover:opacity-100',
          disableDelete && 'pointer-events-none group-hover:opacity-0',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={disableDelete}
              icon={<Trash2 />}
              className="-m-1 scale-90"
              variant="outline"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toast(`确定要删除「${sessionDisplayName}」吗`, {
                  action: {
                    label: '确定',
                    onClick: () =>
                      toast.promise(trigger, {
                        loading: '正在删除...',
                        success: '删除成功',
                        error: '删除失败',
                        finally: () => onDeleted?.(),
                      }),
                  },
                });
              }}
            />
          </TooltipTrigger>
          <TooltipContent>删除会话</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
};
