import React from 'react';

import { Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IResendMessageProps {
  resend: (index?: number) => void;
  messageIndex: number;
}

export const ResendMessage: React.FC<IResendMessageProps> = ({ resend, messageIndex }) => {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          icon={<Repeat2 />}
          variant="outline"
          size="small"
          className="p-1"
          onClick={() => resend(messageIndex)}
        />
      </TooltipTrigger>
      <TooltipContent>{t('workspace.chat-view.chat-bot.resend-message')}</TooltipContent>
    </Tooltip>
  );
};
