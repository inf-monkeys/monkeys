import React, { useState } from 'react';

import { KeyedMutator } from 'swr';

import { useClipboard } from '@mantine/hooks';
import dayjs from 'dayjs';
import { KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';

import { revokeApiKey } from '@/apis/api-keys/api-key.ts';
import { IApiKey, IApiKeyStatus } from '@/apis/api-keys/typings.ts';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimeDiffPrevious } from '@/utils/time.ts';
import { useTranslation } from 'react-i18next';

interface IApiKeyItemProps extends React.ComponentPropsWithoutRef<'div'> {
  apiKey: IApiKey;
  mutate: KeyedMutator<IApiKey[] | undefined>;
}

export const ApiKeyItem: React.FC<IApiKeyItemProps> = ({ apiKey, mutate }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const clipboard = useClipboard();
  const handleRevokeApiKey = (apiKeyId: string) => {
    setLoading(true);
    toast.promise(revokeApiKey(apiKeyId), {
      success: t('common.operate.success'),
      loading: t('common.operate.loading'),
      error: t('common.operate.error'),
      finally: () => {
        setLoading(false);
        mutate();
      },
    });
  };
  const handleCopyApiKey = (apiKey: string) => {
    clipboard.copy(apiKey);
    toast.success(t('common.toast.copy-success'));
  };
  return (
    <Card>
      <CardContent className="flex h-full items-center justify-between gap-2 p-3">
        {apiKey.status === IApiKeyStatus.Revoked ? (
          <Avatar className="flex-shrink-0">
            <AvatarFallback>
              <X />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="flex-shrink-0">
            <AvatarFallback className="bg-greenA-3">
              <KeyRound />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-1 flex-col">
          <span className="flex items-center gap-1 text-sm font-bold">
            {apiKey.desc}
            {apiKey.status === IApiKeyStatus.Revoked && (
              <Tag size="xs">{t('settings.api-key.api-key-item.revoked')}</Tag>
            )}
          </span>
          <span className="flex gap-1 text-xs [&_*]:text-opacity-70">
            <span>{apiKey.apiKey}</span>
            <Tooltip content={dayjs(apiKey.createdTimestamp).format('YYYY-MM-DD HH:mm:ss')}>
              <TooltipTrigger asChild>
                <span>
                  {t('common.utils.created-at', {
                    time: formatTimeDiffPrevious(apiKey.createdTimestamp),
                  })}
                </span>
              </TooltipTrigger>
            </Tooltip>
          </span>
        </div>
        <div className="flex gap-2">
          {apiKey.status != IApiKeyStatus.Revoked && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button theme="danger" disabled={loading}>
                  {t('settings.api-key.api-key-item.operate.revoke.button')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.api-key.api-key-item.operate.revoke.alert.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.api-key.api-key-item.operate.revoke.alert.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRevokeApiKey(apiKey.id)}>
                    {t('common.utils.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => handleCopyApiKey(apiKey.apiKey)}>{t('common.utils.copy')}</Button>
        </div>
      </CardContent>
    </Card>
  );
};
