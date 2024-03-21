import React, { useState } from 'react';

import { KeyedMutator } from 'swr';

import { useClipboard } from '@mantine/hooks';
import { KeyRound, X } from 'lucide-react';
import moment from 'moment/moment';
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
import { useTimeDiff } from '@/utils/time.ts';

interface IApiKeyItemProps extends React.ComponentPropsWithoutRef<'div'> {
  apiKey: IApiKey;
  mutate: KeyedMutator<IApiKey[] | undefined>;
}

export const ApiKeyItem: React.FC<IApiKeyItemProps> = ({ apiKey, mutate }) => {
  const { formatTimeDiffPrevious } = useTimeDiff();
  const [loading, setLoading] = useState(false);
  const clipboard = useClipboard();
  const handleRevokeApiKey = (apiKeyId: string) => {
    setLoading(true);
    toast.promise(revokeApiKey(apiKeyId), {
      success: '操作成功',
      loading: '废弃中......',
      error: '操作失败',
      finally: () => {
        setLoading(false);
        mutate();
      },
    });
  };
  const handleCopyApiKey = (apiKey: string) => {
    clipboard.copy(apiKey);
    toast.success('复制成功');
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
            {apiKey.status === IApiKeyStatus.Revoked && <Tag size="xs">已废弃</Tag>}
          </span>
          <span className="flex gap-1 text-xs [&_*]:text-opacity-70">
            <span>{apiKey.apiKey}</span>
            <Tooltip content={moment(apiKey.createdTimestamp).format('YYYY-MM-DD HH:mm:ss')}>
              <TooltipTrigger asChild>
                <span>创建于 {formatTimeDiffPrevious(apiKey.createdTimestamp)}</span>
              </TooltipTrigger>
            </Tooltip>
          </span>
        </div>
        <div className="flex gap-2">
          {apiKey.status != IApiKeyStatus.Revoked && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button theme="danger" disabled={loading}>
                  废弃
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>废弃前确认</AlertDialogTitle>
                  <AlertDialogDescription>
                    确认废弃该 API 密钥？正在使用该密钥的应用将无法访问 API。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRevokeApiKey(apiKey._id)}>确定</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => handleCopyApiKey(apiKey.apiKey)}>复制</Button>
        </div>
      </CardContent>
    </Card>
  );
};
