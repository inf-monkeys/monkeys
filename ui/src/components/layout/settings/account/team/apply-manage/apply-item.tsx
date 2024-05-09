import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeamApply } from '@/apis/authz/team';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { maskPhone } from '@/utils/maskdata.ts';

interface IApplyItemProps extends React.ComponentPropsWithoutRef<'div'> {
  user: IVinesUser;
  teamId?: string;
  afterOperate?: () => void;
}

export const ApplyItem: React.FC<IApplyItemProps> = ({ user, teamId, afterOperate }) => {
  const { t } = useTranslation();

  const [isHandleAccept, setIsHandleAccept] = useState(false);
  const handleAccept = (accept: boolean) => {
    if (teamId) {
      setIsHandleAccept(true);
      toast.promise(
        updateTeamApply({
          teamId,
          applyUserId: user.id,
          apply: accept,
        }),
        {
          // success: `已${accept ? '同意' : '拒绝'}该请求`,
          success: t('settings.account.team.apply-manage.apply-item.operate-toast.index', {
            operate: accept
              ? t('settings.account.team.apply-manage.apply-item.operate-toast.accept')
              : t('settings.account.team.apply-manage.apply-item.operate-toast.reject'),
          }),
          loading: t('common.operate.loading'),
          error: t('common.operate.error'),
          finally: () => {
            setIsHandleAccept(false);
            afterOperate?.();
          },
        },
      );
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-4">
          <Avatar className="size-10">
            <AvatarImage className="aspect-auto" src={user?.photo} alt={user?.name} />
            <AvatarFallback className="rounded-none p-2 text-xs">{user.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="line-clamp-1 font-semibold leading-tight">{user.name}</h1>
            <span className="line-clamp-1 text-xs text-opacity-70">{user?.phone && maskPhone(user?.phone)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button disabled={isHandleAccept} theme="danger" onClick={() => handleAccept(false)}>
            {t('settings.account.team.apply-manage.apply-item.operate.reject')}
          </Button>
          <Button disabled={isHandleAccept} onClick={() => handleAccept(true)}>
            {t('settings.account.team.apply-manage.apply-item.operate.accept')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
