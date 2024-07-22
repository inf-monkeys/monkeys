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
  simple?: boolean;
  photoSize?: number;
}

export const User: React.FC<IUserProps> = ({ name, account, photo, isCollapsed, simple, photoSize = 8 }) => {
  return (
    <div className={cn('flex items-center gap-2', !simple && 'py-1')}>
      <Avatar className={cn(`size-${photoSize}`, isCollapsed && 'size-9')}>
        <AvatarImage className="aspect-auto" src={photo} alt={name} />
        <AvatarFallback className="rounded-none p-2 text-xs">{(name ?? 'AI').substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="mt-0.5 flex flex-1 flex-col gap-1 [&_h1]:text-left [&_span]:text-left">
        {name ? (
          <h1 className="max-w-[5.5rem] truncate text-sm font-bold leading-none">{name}</h1>
        ) : (
          <Skeleton className="h-5 w-full" />
        )}
        {!simple &&
          (account ? (
            <span className="max-w-[5.5rem] truncate text-xs leading-none text-black text-opacity-60 dark:text-gold-12 dark:opacity-70">
              {account}
            </span>
          ) : (
            <Skeleton className="h-4 w-full" />
          ))}
      </div>
    </div>
  );
};
