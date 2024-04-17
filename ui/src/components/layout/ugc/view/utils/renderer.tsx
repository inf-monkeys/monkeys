import React from 'react';

import dayjs from 'dayjs';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IUgcTagSelectorProps, UgcTagSelector } from '@/components/layout/ugc/view/tag-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesIconSize, VinesIcon } from '@/components/ui/vines-icon';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const RenderTime: React.FC<{ time: number }> = ({ time: rawTime }) => {
  const time = rawTime >= 1000000000000 ? rawTime : rawTime * 1000;
  return (
    <Tooltip content={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}>
      <TooltipTrigger asChild>
        <span className="cursor-default">{formatTimeDiffPrevious(time)}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export const RenderUser: React.FC<{
  user: Partial<IVinesUser>;
}> = ({ user }) => (
  <div className="flex items-center gap-1">
    <Avatar className="size-5">
      <AvatarImage className="aspect-auto" src={user?.photo} alt={user?.name ?? '未知用户'} />
      <AvatarFallback className="rounded-none p-2 text-xs">{(user?.name ?? '未知用户').substring(0, 2)}</AvatarFallback>
    </Avatar>
    <span>{user?.name ?? '未知用户'}</span>
  </div>
);
export const RenderDescription: React.FC<{
  description?: string;
}> = ({ description }) =>
  !description || description === '' ? (
    <span className="line-clamp-3 text-opacity-70">暂无描述</span>
  ) : (
    <Tooltip content={<span className="flex max-w-64 flex-wrap">{description}</span>} contentProps={{ side: 'bottom' }}>
      <TooltipTrigger asChild>
        <span className="line-clamp-3 text-opacity-70">{description}</span>
      </TooltipTrigger>
    </Tooltip>
  );

export const RenderIcon: React.FC<{
  iconUrl?: string;
  size?: IVinesIconSize;
}> = ({ iconUrl, size = 'md' }) => (
  <VinesIcon size={size}>{iconUrl && iconUrl.trim() != '' ? iconUrl : 'emoji:🍀:#ceefc5'}</VinesIcon>
);

export const RenderTags = (props: IUgcTagSelectorProps) => <UgcTagSelector {...props} />;
