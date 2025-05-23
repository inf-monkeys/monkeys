import React from 'react';

import { MessageSquare, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDeleteWorkflowChatSession } from '@/apis/workflow/chat';
import { IVinesChatSession } from '@/apis/workflow/chat/typings.ts';
import { spaceSidebarTabVariants } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IChatSessionProps {
  session: IVinesChatSession;
  disableDelete?: boolean;
  onDeleted?: () => void;
  active?: boolean;
  onClick?: () => void;
}

export const ChatSession: React.FC<IChatSessionProps> = ({ session, active, onClick, disableDelete, onDeleted }) => {
  const { t } = useTranslation();

  const { trigger } = useDeleteWorkflowChatSession(session.id);

  const sessionDisplayName = session.displayName;

  return (
    <Card
      className={cn(
        spaceSidebarTabVariants(active ? { status: 'active' } : {}),
        'group flex items-center gap-2 bg-transparent shadow-transparent hover:bg-accent',
        active && 'bg-background',
      )}
      onClick={onClick}
    >
      <MessageSquare size={16} />
      <span className="text-sm">{sessionDisplayName}</span>
      {!disableDelete && (
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
                  toast(t('workspace.chat-view.sidebar.delete.title', { sessionDisplayName }), {
                    action: {
                      label: t('workspace.chat-view.sidebar.delete.action'),
                      onClick: () =>
                        toast.promise(trigger, {
                          loading: t('workspace.chat-view.sidebar.delete.loading'),
                          success: t('workspace.chat-view.sidebar.delete.success'),
                          error: t('workspace.chat-view.sidebar.delete.error'),
                          finally: () => onDeleted?.(),
                        }),
                    },
                  });
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.chat-view.sidebar.delete.label')}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </Card>
  );
};
