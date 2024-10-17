import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { LogOut, User2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId/index.lazy.tsx';
import VinesEvent from '@/utils/events.ts';

interface IUserCardProps extends React.ComponentPropsWithoutRef<'div'> {}

export const UserCard: React.FC<IUserCardProps> = () => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });
  const { userPhoto, userName } = useVinesUser();
  const { teamId, team } = useVinesTeam();

  const teamName = team?.name ?? '默认团队';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {userName}
          <br />
          {t([`components.layout.main.sidebar.teams.${teamName ?? ''}`, teamName ?? ''])}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => navigate({ to: '/$teamId/settings', params: { teamId } })}
          >
            <User2 strokeWidth={1.5} size={16} />
            <span>{t('workspace.wrapper.user.user-center')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex gap-2 text-red-10" onClick={() => VinesEvent.emit('vines-logout')}>
            <LogOut strokeWidth={1.5} size={16} />
            <span>{t('workspace.wrapper.user.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
