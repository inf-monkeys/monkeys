import React from 'react';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { UserAccount } from '@/components/layout/settings/account/user/user-account';
import { UserName } from '@/components/layout/settings/account/user/user-name';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IUserProps extends React.ComponentPropsWithoutRef<'div'> {}

export const User: React.FC<IUserProps> = () => {
  const [user, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const userName = user.name || 'AI';

  return (
    <Card>
      <CardHeader>
        <CardTitle>账号信息</CardTitle>
        <CardDescription>点击即可编辑信息</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Avatar className="size-10">
          <AvatarImage className="aspect-auto" src={user.photo} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center">
          <UserName user={user} setUser={setUser} />
          <UserAccount user={user} setUser={setUser} />
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
