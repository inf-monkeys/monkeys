import React from 'react';

import dayjs from 'dayjs';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesIconSize, VinesIcon } from '@/components/ui/vines-icon';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const RenderTime: React.FC<{ time: number }> = ({ time }) => {
  return (
    <Tooltip content={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}>
      <TooltipTrigger asChild>
        <span className="cursor-default">{formatTimeDiffPrevious(time)}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export const RenderUser: React.FC<{
  user: IVinesUser;
}> = ({ user }) => {
  return (
    <div className="flex items-center gap-1">
      <Avatar className="size-5">
        <AvatarImage className="aspect-auto" src={user.photo} alt={user.name} />
        <AvatarFallback className="rounded-none p-2 text-xs">{user.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <span>{user.name}</span>
    </div>
  );
};

export const RenderDescription: React.FC<{
  description?: string;
}> = ({ description }) => {
  return <span className="text-opacity-70">{description || '暂无描述'}</span>;
};

export const RenderIcon: React.FC<{
  iconUrl?: string;
  size?: IVinesIconSize;
}> = ({ iconUrl, size = 'md' }) => {
  return <VinesIcon size={size}>{iconUrl ?? ''}</VinesIcon>;
};
