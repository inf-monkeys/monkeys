import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { logout, saveAuthToken } from '@/components/router/auth-guard.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Route } from '@/pages/login.tsx';

export interface IUser {
  id: string;
  token: string;
  name: string;
  shortName: string;
  user: string;
  photo: string;
}

interface IUserListProps extends React.ComponentPropsWithoutRef<'div'> {
  users: IUser[];
}

export const UserList: React.FC<IUserListProps> = ({ users }) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { redirect_url } = Route.useSearch();

  const handleToggleUser = (token: string, name: string) => {
    toast.promise(
      new Promise((resolve) =>
        setTimeout(() => {
          if (saveAuthToken(token) > 0) {
            resolve(
              navigate({
                to: redirect_url ?? '/',
              }),
            );
          }
        }, 500),
      ),
      {
        loading: '正在切换身份...',
        success: '已切换到身份：' + name,
        error: '切换身份失败',
      },
    );
  };

  const handleLogout = (id: string) => logout(id);

  return users.map(({ id, name, shortName, user, photo, token }) => (
    <div
      key={id}
      className="relative flex w-full cursor-pointer items-center gap-4 rounded-md bg-white p-4 shadow-md transition-opacity hover:opacity-80 dark:bg-gray-3 dark:bg-opacity-90"
    >
      <Avatar>
        <AvatarImage className="aspect-auto" src={photo} alt={name} />
        <AvatarFallback className="rounded-none p-2 text-xs">{shortName}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <h1 className="font-bold leading-tight">{name}</h1>
        <span className="text-xs leading-tight text-black text-opacity-70 dark:text-gold-12 dark:opacity-70">
          {user}
        </span>
      </div>
      <div className="absolute z-0 size-full" onClick={() => handleToggleUser(token, name)} />
      <div className="flex flex-1 justify-end">
        <Button className="z-10" icon={<LogOut />} onClick={() => handleLogout(id)} />
      </div>
    </div>
  ));
};
