import React from 'react';

import { Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';

interface IMessageToolbarProps extends React.ComponentPropsWithoutRef<'div'> {
  chatId: string;
  content: string;
}

export const MessageToolbar: React.FC<IMessageToolbarProps> = ({ content }) => {
  const { t } = useTranslation();

  const { copy, copied } = useCopy();

  return (
    <div className="absolute -bottom-1 -right-9 flex scale-80 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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
    </div>
  );
};
