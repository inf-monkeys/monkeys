import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { cn } from '@/utils';

export interface IUserProps {
  id?: string;
  name?: string;
  account?: string;
  photo?: string;
  isCollapsed?: boolean;
}

export const User: React.FC<IUserProps> = ({ name, account, photo, isCollapsed }) => {
  return (
    <div className="flex items-center gap-2 py-1">
      <Avatar className={cn('size-8', isCollapsed && 'size-9')}>
        <AvatarImage className="aspect-auto" src={photo} alt={name} />
        <AvatarFallback className="rounded-none p-2 text-xs">{(name ?? 'AI').substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="mt-0.5 flex flex-1 flex-col gap-1 [&_h1]:text-left [&_span]:text-left">
        {name ? (
          <h1 className="line-clamp-1 text-sm font-bold leading-none">{name}</h1>
        ) : (
          <Skeleton className="h-5 w-full" />
        )}
        {account ? (
          <span className="text-xxs line-clamp-1 leading-none text-black text-opacity-60 dark:text-gold-12 dark:opacity-70">
            {account}
          </span>
        ) : (
          <Skeleton className="h-4 w-full" />
        )}
      </div>
    </div>
  );
};
