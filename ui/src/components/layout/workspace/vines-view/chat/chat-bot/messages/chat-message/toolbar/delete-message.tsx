import React from 'react';

import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IDeleteMessageProps {
  messageIndex: number;
  setMessageByIndex: (index: number, message?: Partial<IVinesMessage>) => void;
}

export const DeleteMessage: React.FC<IDeleteMessageProps> = ({ messageIndex, setMessageByIndex }) => {
  const { t } = useTranslation();

  return (
    <AlertDialog>
      <Tooltip>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button icon={<Trash />} variant="outline" size="small" className="p-1" />
          </TooltipTrigger>
        </AlertDialogTrigger>
        <TooltipContent>{t('workspace.chat-view.chat-bot.message-toolbar.del.label')}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('workspace.chat-view.chat-bot.message-toolbar.del.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('workspace.chat-view.chat-bot.message-toolbar.del.desc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => setMessageByIndex(messageIndex)}>
            {t('common.utils.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
