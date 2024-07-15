import * as React from 'react';
import { forwardRef } from 'react';

import { cn } from '@/utils';

export interface CircularProgressProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(({ className, size }, ref) => {
  const center = 16;
  const strokeWidth = size === 'sm' ? 2 : 3;
  const radius = 16 - strokeWidth;
  const circumference = 2 * radius * Math.PI;
  const offset = circumference - 0.25 * circumference;

  return (
    <div ref={ref} className={cn('flex max-w-fit flex-col items-center justify-center gap-1', className)}>
      <div className="relative block">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="relative z-0 h-12 w-12 animate-spinner-ease-spin overflow-hidden text-primary"
          strokeWidth={strokeWidth}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            role="presentation"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={0}
            transform="rotate(-90 16 16)"
            strokeLinecap="round"
            className="h-full stroke-default-300/50"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            role="presentation"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 16 16)"
            strokeLinecap="round"
            className="h-full stroke-current transition-all !duration-500"
          />
        </svg>
      </div>
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';

export { CircularProgress };
