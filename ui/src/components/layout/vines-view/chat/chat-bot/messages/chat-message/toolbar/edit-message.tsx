import React from 'react';

import { useControllableValue } from 'ahooks';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IEditMessageProps {
  content: string;
  messageIndex: number;
  setMessageByIndex: (index: number, message?: Partial<IVinesMessage>) => void;
}

export const EditMessage: React.FC<IEditMessageProps> = ({ content, messageIndex, setMessageByIndex }) => {
  const { t } = useTranslation();

  const [message, setMessage] = useControllableValue({
    value: content,
    onChange: (value) => setMessageByIndex(messageIndex, { content: value }),
  });

  return (
    <Dialog
      onOpenChange={(status) => {
        if (!status && !message) {
          setMessageByIndex(messageIndex);
        }
      }}
    >
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button icon={<Pencil />} variant="outline" size="small" className="p-1" />
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent>{t('workspace.chat-view.chat-bot.message-toolbar.edit.label')}</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workspace.chat-view.chat-bot.message-toolbar.edit.label')}</DialogTitle>
          <DialogDescription>{t('workspace.chat-view.chat-bot.message-toolbar.edit.desc')}</DialogDescription>
        </DialogHeader>
        <Textarea className="min-h-48" value={message} onChange={(e) => setMessage(e.target.value)} />
      </DialogContent>
    </Dialog>
  );
};
