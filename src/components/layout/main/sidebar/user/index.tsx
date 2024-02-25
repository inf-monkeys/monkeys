import React from 'react';

import { IUser } from '@/components/router/auth-guard.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLocalStorage } from '@/utils';

interface ISidebarUserProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SidebarUser: React.FC<ISidebarUserProps> = () => {
  const [user] = useLocalStorage<Partial<IUser>>('vines-user', {});

  const userName = user.name;
  const shortName = (userName ?? 'AI').substring(0, 2);
  const userPhoto = user.photo;

  return (
    <div className="rounded-xl bg-mauve-2 p-3">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{shortName}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col">
          {userName ? <h1 className="font-bold leading-tight">{userName}</h1> : <Skeleton className="h-5 w-full" />}
          {/*<span className="text-xs leading-tight text-black text-opacity-70 dark:text-gold-12 dark:opacity-70">*/}
          {/*  团队名*/}
          {/*</span>*/}
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
};
