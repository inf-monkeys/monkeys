import React from 'react';

import { setWith } from 'lodash';

import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { UserAccount } from '@/components/layout/settings/account/user/user-account';
import { UserName } from '@/components/layout/settings/account/user/user-name';
import { IUserTokens } from '@/components/router/guard/auth.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesImageEditor } from '@/components/ui/image-editor';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IUserProps extends React.ComponentPropsWithoutRef<'div'> {}

export const User: React.FC<IUserProps> = () => {
  const [user, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [users, setUsers] = useLocalStorage<IUserTokens>('vines-tokens', {});

  const handleUpdateUser = (key: string, val: string) => {
    setUser({ ...user, [key]: val });
    const userId = user?.id ?? '';
    if (!users[userId]) return;
    const newUsers = setWith(users, `${userId}.data.${key}`, val);
    setUsers(newUsers);
    updateUserInfo({ [key]: val });
  };

  const userName = user.name || 'AI';
  const userPhoto = user.photo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>账号信息</CardTitle>
        <CardDescription>点击即可编辑信息</CardDescription>
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
          <Button theme="danger" size="small" onClick={() => VinesEvent.emit('vines-logout')}>
            退出登录
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
