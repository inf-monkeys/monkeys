import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { LogOut, User2 } from 'lucide-react';

import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
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
import { Separator } from '@/components/ui/separator.tsx';
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';
import VinesEvent from '@/utils/events.ts';

interface IWorkspaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {}

export const WorkspaceHeader: React.FC<IWorkspaceHeaderProps> = () => {
  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });
  const navigate = useNavigate({ from: Route.fullPath });
  const { userPhoto, userName } = useVinesUser();

  return (
    <header className="flex h-14 w-full items-center justify-between bg-slate-1 px-6 shadow">
      <div className="flex h-full items-center gap-5">
        <VinesLogo
          description=""
          height={32}
          className="cursor-pointer"
          onClick={() => navigate({ to: '/$teamId', params: { teamId } })}
        />
        <Separator orientation="vertical" className="h-1/2" />
        <WorkflowInfoCard />
      </div>
      <div className="flex items-center gap-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-8 cursor-pointer">
              <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
              <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={() => navigate({ to: '/$teamId/settings', params: { teamId } })}
              >
                <User2 strokeWidth={1.5} size={16} />
                <span>个人中心</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 text-red-10" onClick={() => VinesEvent.emit('vines-logout')}>
                <LogOut strokeWidth={1.5} size={16} />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
