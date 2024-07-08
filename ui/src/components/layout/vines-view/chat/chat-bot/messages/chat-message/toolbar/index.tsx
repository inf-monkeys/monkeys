import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { execCopy } from '@/utils';

interface IMessageToolbarProps extends React.ComponentPropsWithoutRef<'div'> {
  chatId: string;
  content: string;
}

export const MessageToolbar: React.FC<IMessageToolbarProps> = ({ content }) => {
  const { t } = useTranslation();
  const clipboard = useClipboard();

  return (
    <div className="absolute -bottom-1 -right-9 flex scale-80 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            icon={clipboard.copied ? <CopyCheck /> : <Copy />}
            variant="outline"
            size="small"
            className="p-1"
            onClick={() => {
              clipboard.copy(content);
              if (!clipboard.copied && !execCopy(content)) toast.error(t('common.toast.copy-failed'));
              else toast.success(t('common.toast.copy-success'));
            }}
          />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
