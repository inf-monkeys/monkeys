import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';

interface ITeamProps extends React.ComponentPropsWithoutRef<'div'> {
  logo?: string;
  name?: string;
  description?: string;
}

export const Team: React.FC<ITeamProps> = ({ name, logo, description }) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-5">
        <AvatarImage className="aspect-auto" src={logo} alt={name} />
        <AvatarFallback className="rounded-none p-2 text-xs">团队</AvatarFallback>
      </Avatar>
      <span className="line-clamp-1 font-bold">{name}</span>
    </div>
  );
};
