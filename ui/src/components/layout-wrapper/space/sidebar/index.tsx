import React from 'react';

import { cn } from '@/utils';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  return (
    <nav
      className={cn(
        'flex w-56 flex-col justify-between gap-global overflow-y-hidden rounded-lg border border-input bg-slate-1 p-global',
      )}
    >
      {children}
    </nav>
  );
};
