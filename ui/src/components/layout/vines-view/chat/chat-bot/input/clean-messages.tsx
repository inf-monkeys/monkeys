import React from 'react';

import { useTranslation } from 'react-i18next';

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { IVinesMessage } from '../use-chat';

interface ICleanMessagesProps extends React.ComponentPropsWithoutRef<'div'> {
  setMessages: (messages: IVinesMessage[]) => void;
}

export const CleanMessages: React.FC<ICleanMessagesProps> = ({ children, setMessages }) => {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.chat-view.chat-bot.clean-messages.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workspace.chat-view.chat-bot.clean-messages.desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('workspace.chat-view.chat-bot.clean-messages.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setMessages([])}>
              {t('workspace.chat-view.chat-bot.clean-messages.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent>{t('workspace.chat-view.chat-bot.clean-messages.label')}</TooltipContent>
    </Tooltip>
  );
};
