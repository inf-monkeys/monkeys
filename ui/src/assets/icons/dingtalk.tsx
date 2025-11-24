import React from 'react';

import { cn } from '@/utils';

export const DingtalkIcon: React.FC<React.ComponentPropsWithoutRef<'svg'>> = ({ className, ...props }) => {
  return (
    <svg
      className={cn('fill-current text-sky-500', className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path
        d="M9 6.5c0-.552.448-1 1-1h3.25C15.545 5.5 17 6.955 17 8.75c0 1.795-1.455 3.25-3.25 3.25H11v3.5c0 .552-.448 1-1 1H9c-.552 0-1-.448-1-1V6.5Zm2 1v3h2.75c.69 0 1.25-.56 1.25-1.25S14.44 8 13.75 8H11Z"
        fill="currentColor"
      />
    </svg>
  );
};
