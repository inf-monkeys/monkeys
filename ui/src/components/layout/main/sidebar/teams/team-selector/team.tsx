import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, useGetDisplayTextFromPlainTextJson } from '@/utils';

interface ITeamProps {
  className?: string;

  logo?: string;
  name?: string;
  description?: string;
}

export const Team: React.FC<ITeamProps> = ({ className, name, logo, description }) => {
  const teamDisplayName = useGetDisplayTextFromPlainTextJson(name || '');
  const teamDescriptionDisplayName = useGetDisplayTextFromPlainTextJson(description || '');
  return (
    <div className={cn('w-full', className)}>
      <div className="flex w-full items-center gap-2">
        <Avatar className="size-5 rounded">
          <AvatarImage className="aspect-auto" src={logo} alt={teamDisplayName} />
          <AvatarFallback className="text-xxs rounded-none p-2 !text-[8px]">
            {teamDisplayName?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="line-clamp-1 text-sm font-bold">{teamDisplayName}</span>
      </div>

      {teamDescriptionDisplayName && (
        <div className="ml-7 flex h-0 items-center overflow-hidden transition-all group-hover:h-4 group-hover:pt-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xxs line-clamp-1 text-muted-foreground">{teamDescriptionDisplayName}</span>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={48}>
              {teamDescriptionDisplayName}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
