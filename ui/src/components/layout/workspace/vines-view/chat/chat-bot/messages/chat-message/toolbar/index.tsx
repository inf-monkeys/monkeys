import React from 'react';

import { Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DeleteMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message/toolbar/delete-message.tsx';
import { EditMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/messages/chat-message/toolbar/edit-message.tsx';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';

interface IMessageToolbarProps extends React.ComponentPropsWithoutRef<'div'> {
  setMessageByIndex: (index: number, message?: Partial<IVinesMessage>) => void;
  content: string;
  messageIndex: number;
}

export const MessageToolbar: React.FC<IMessageToolbarProps> = ({ content, setMessageByIndex, messageIndex }) => {
  const { t } = useTranslation();

  const { copy, copied } = useCopy();

  return (
    <div className="-m-1 -ml-2 flex scale-75 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
      <DeleteMessage setMessageByIndex={setMessageByIndex} messageIndex={messageIndex} />
    </div>
  );
};
