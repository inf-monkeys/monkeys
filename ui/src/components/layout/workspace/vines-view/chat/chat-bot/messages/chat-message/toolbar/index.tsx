import React from 'react';

import { Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DeleteMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message/toolbar/delete-message.tsx';
import { EditMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message/toolbar/edit-message.tsx';
import { ResendMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message/toolbar/resend-message.tsx';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { cn } from '@/utils';

interface IMessageToolbarProps extends React.ComponentPropsWithoutRef<'div'> {
  setMessageByIndex: (index: number, message?: Partial<IVinesMessage>) => void;
  content: string;
  messageIndex: number;
  resend: (index?: number) => void;
}

export const MessageToolbar: React.FC<IMessageToolbarProps> = ({
  className,
  content,
  setMessageByIndex,
  messageIndex,
  resend,
}) => {
  const { t } = useTranslation();

  const { copy, copied } = useCopy();

  return (
    <div
      className={cn('-m-1 -ml-3 flex scale-75 gap-1 opacity-0 transition-opacity group-hover:opacity-100', className)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            icon={copied ? <CopyCheck /> : <Copy />}
            variant="outline"
            size="small"
            className="p-1"
            onClick={() => copy(content)}
          />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
      </Tooltip>
      <EditMessage content={content} setMessageByIndex={setMessageByIndex} messageIndex={messageIndex} />
      <ResendMessage resend={resend} messageIndex={messageIndex} />
      <DeleteMessage setMessageByIndex={setMessageByIndex} messageIndex={messageIndex} />
    </div>
  );
};
