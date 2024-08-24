import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIconRender } from '@/components/ui/vines-icon/lucide/render.tsx';

interface IVirtuaIconGridItemProps {
  name: string;

  onClick?: (name: string) => void;
}

export const VirtuaIconGridItem: React.FC<IVirtuaIconGridItemProps> = ({ name, onClick }) => {
  return (
    <Tooltip key={name}>
      <TooltipTrigger>
        <div
          className="cursor-pointer rounded-md bg-gray-3 bg-opacity-60 p-3 transition-all hover:bg-opacity-15"
          onClick={() => onClick?.(name)}
        >
          <LucideIconRender src={name} className="size-6" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{name}</TooltipContent>
    </Tooltip>
  );
};
