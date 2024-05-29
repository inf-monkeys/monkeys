import React from 'react';

import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat/use-chat.ts';
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

interface ICleanMessagesProps extends React.ComponentPropsWithoutRef<'div'> {
  setMessages: (messages: IVinesMessage[]) => void;
}

export const CleanMessages: React.FC<ICleanMessagesProps> = ({ children, setMessages }) => {
  return (
    <Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要清空当前对话吗？</AlertDialogTitle>
            <AlertDialogDescription>仅清空本地对话记录，刷新可恢复历史数据。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => setMessages([])}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent>清空对话（本地）</TooltipContent>
    </Tooltip>
  );
};
