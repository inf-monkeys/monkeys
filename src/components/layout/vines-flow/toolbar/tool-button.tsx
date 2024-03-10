import React from 'react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { KbdKey } from '@/components/ui/kbd/typings.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IToolButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  tip: string;
  icon: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  keys?: KbdKey | KbdKey[] | string[] | string;
}

export const ToolButton: React.FC<IToolButtonProps> = ({ onClick, className, tip, icon, keys, side = 'right' }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn('[&_svg]:stroke-gold-12', className)}
          variant="borderless"
          icon={icon}
          onClick={onClick}
        />
      </TooltipTrigger>
      <TooltipContent side={side} className="flex items-center gap-2">
        {tip}
        {keys && <Kbd keys={keys} />}
      </TooltipContent>
    </Tooltip>
  );
};
