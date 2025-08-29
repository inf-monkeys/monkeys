import React from 'react';

import { useRoundedClass } from '@/apis/common';
import { cn } from '@/utils';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  const { roundedClass } = useRoundedClass();

  return (
    <nav
      className={cn(
        'flex w-56 flex-col justify-between gap-global overflow-y-hidden border border-input bg-slate-1 p-global',
        roundedClass,
      )}
    >
      {children}
    </nav>
  );
};
