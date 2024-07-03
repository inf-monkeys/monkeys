import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { isEmpty } from 'lodash';
import { Copy, CopyCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ToolDisplay } from '@/components/layout/vines-view/chat/chat-bot/messages/chat-message/tool-display.tsx';
import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { VinesMarkdown } from '@/components/ui/markdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { execCopy } from '@/utils';

interface IVinesChatMessageProps {
  data: IVinesMessage;
  index: number;
  LastItemIndex: number;

  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
}

const EMPTY_CONTENT = String.fromCharCode(12288);

export const VinesChatMessage: React.FC<IVinesChatMessageProps> = ({
  data,
  index,
  LastItemIndex,
  isLoading,
  botPhoto,
  userPhoto,
}) => {
  const { t } = useTranslation();
  const clipboard = useClipboard();

  const isUser = data.role === 'user';
  const content = data.content ?? '';
  const isEmptyMessage = isEmpty(content.trim());

  const extra = data.extra;

  return (
    <div className="flex flex-col gap-6 py-4">
      {isUser ? (
        <div className="group flex w-full max-w-full flex-row-reverse gap-4">
          <Avatar className="size-8 cursor-pointer">
            <AvatarImage className="aspect-auto" src={userPhoto} alt={isUser ? 'user' : 'assistant'} />
            <AvatarFallback className="rounded-none p-2 text-xs">{isUser ? 'user' : 'assistant'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <Card className="p-4 text-sm">{content}</Card>
          </div>
        </div>
      ) : (
        <div className="group flex flex-row items-start gap-4">
          <VinesIcon size="sm">{botPhoto}</VinesIcon>
          <Card className="relative max-w-[calc(100%-3rem)] p-4 text-sm">
            <ToolDisplay data={extra} />
            <VinesMarkdown className={isLoading && LastItemIndex === index ? 'vines-result-streaming' : ''} allowHtml>
              {content + (isEmptyMessage ? EMPTY_CONTENT : '')}
            </VinesMarkdown>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  icon={clipboard.copied ? <CopyCheck /> : <Copy />}
                  variant="outline"
                  size="small"
                  className="absolute -bottom-1 -right-9 flex scale-80 gap-2 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    clipboard.copy(content);
                    if (!clipboard.copied && !execCopy(content)) toast.error(t('common.toast.copy-failed'));
                    else toast.success(t('common.toast.copy-success'));
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
            </Tooltip>
          </Card>
        </div>
      )}
    </div>
  );
};
