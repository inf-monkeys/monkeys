import React from 'react';

import { cn } from '@/utils';

interface IViewTitleProps {
  themeGradient?: boolean;
  displayName?: string;
}

export const ViewTitle: React.FC<IViewTitleProps> = ({ themeGradient = false, displayName }) => {
  return displayName ? (
    <div className="absolute left-[calc(var(--global-spacing)*1.5)] top-0 flex flex-col gap-1">
      <span
        className={cn(
          'border-t-[3px] pt-[8px] font-bold',
          themeGradient ? 'bg-gradient bg-clip-text text-gradient' : 'border-vines-500 text-vines-500',
        )}
        style={
          themeGradient
            ? {
                borderImage: 'var(--vines-gradient) 1',
              }
            : {}
        }
      >
        {displayName}
      </span>
    </div>
  ) : null;
};
