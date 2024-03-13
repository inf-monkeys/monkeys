import React from 'react';

import { cn } from '@/utils';

interface IIndicatorProps extends React.ComponentPropsWithoutRef<'div'> {
  dot?: boolean;
}

export const Indicator = React.forwardRef<HTMLDivElement, IIndicatorProps>(
  ({ children, className, dot = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        {children}
        {dot && (
          <span className="absolute right-0 top-0 -mr-1 -mt-1 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vines-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-vines-500"></span>
          </span>
        )}
      </div>
    );
  },
);
