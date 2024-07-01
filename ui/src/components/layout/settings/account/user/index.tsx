import React from 'react';

import { setWith } from 'lodash';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { UserAccount } from '@/components/layout/settings/account/user/user-account';
import { UserName } from '@/components/layout/settings/account/user/user-name';
import { IUserTokens } from '@/components/router/guard/auth.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesImageEditor } from '@/components/ui/image-editor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IUserProps extends React.ComponentPropsWithoutRef<'div'> {}

export const User: React.FC<IUserProps> = () => {
  const { t } = useTranslation();

  const [user, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [users, setUsers] = useLocalStorage<IUserTokens>('vines-tokens', {});

  const handleUpdateUser = (key: string, val: string) => {
    setUser({ ...user, [key]: val });
    const userId = user?.id ?? '';
    if (!users[userId]) return;
    const newUsers = setWith(users, `${userId}.data.${key}`, val);
    setUsers(newUsers);
    void updateUserInfo({ [key]: val });
  };

  const userName = user.name || 'AI';
  const userPhoto = user.photo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.account.user.title')}</CardTitle>
        <CardDescription>{t('settings.account.user.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <VinesImageEditor value={userPhoto} onChange={(val) => handleUpdateUser('photo', val)}>
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
            <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </VinesImageEditor>
        <div className="flex flex-col justify-center">
          <UserName user={user} updateUser={handleUpdateUser} />
          <UserAccount user={user} updateUser={handleUpdateUser} />
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <TooltipTrigger>
                  <Button icon={<LogOut className="!stroke-red-10" strokeWidth={1.5} size={16} />} variant="outline" />
                </TooltipTrigger>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('auth.users.title')}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => VinesEvent.emit('vines-logout', user.id)}>
                    {t('common.utils.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <TooltipContent>{t('auth.users.logout')}</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};
