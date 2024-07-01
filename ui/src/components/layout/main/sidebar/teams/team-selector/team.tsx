import React from 'react';

import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { cn } from '@/utils';

interface ITeamProps extends React.ComponentPropsWithoutRef<'div'> {
  logo?: string;
  name?: string;
  description?: string;
}

export const Team: React.FC<ITeamProps> = ({ className, name, logo }) => {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar className="size-5">
        <AvatarImage className="aspect-auto" src={logo} alt={name} />
        <AvatarFallback className="rounded-none p-2 text-xs">
          {t('components.layout.main.sidebar.teams.team-selector.avatar-fallback')}
        </AvatarFallback>
      </Avatar>
      <span className="line-clamp-1 font-bold">
        {t([`components.layout.main.sidebar.teams.${name ?? ''}`, name ?? ''])}
      </span>
    </div>
  );
};
