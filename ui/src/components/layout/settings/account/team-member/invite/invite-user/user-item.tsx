import React, { useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createTeamInviteLink, useTeamInvites } from '@/apis/authz/team';
import { ITeamInviteLinkOutdateType } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { useLocalStorage } from '@/utils';
import { maskPhone } from '@/utils/maskdata.ts';

interface IUserItemProps extends React.ComponentPropsWithoutRef<'div'> {
  user: IVinesUser;
  teamId?: string;
  outdateType: ITeamInviteLinkOutdateType;
}

export const UserItem: React.FC<IUserItemProps> = ({ user, teamId, outdateType }) => {
  const { t } = useTranslation();

  const { mutate: mutateInviteLinkList } = useTeamInvites(teamId);
  const [currentUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [isHandleCopyLink, setIsHandleCopyLink] = useState(false);
  const clipboard = useClipboard();
  const handleCopyLink = () => {
    if (teamId && currentUser.id) {
      setIsHandleCopyLink(true);
      toast.promise(
        createTeamInviteLink({
          teamId,
          outdateType,
          targetUserId: user.id,
          inviterUserId: currentUser.id,
        }),
        {
          success: (link) => {
            void mutateInviteLinkList();
            clipboard.copy(link);
            return t('common.toast.copy-success');
          },
          loading: t('common.operate.loading'),
          error: t('common.operate.error'),
          finally: () => {
            setIsHandleCopyLink(false);
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
            <AvatarFallback className="rounded-none p-2 text-xs">{user?.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="line-clamp-1 font-semibold leading-tight">{user.name}</h1>
            <span className="line-clamp-1 text-xs text-opacity-70">{user?.phone && maskPhone(user?.phone)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button disabled={isHandleCopyLink} onClick={() => handleCopyLink()}>
            {t('common.utils.copy')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
