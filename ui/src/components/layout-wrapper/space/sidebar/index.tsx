import React from 'react';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  return (
    <nav className="p-global gap-global flex w-56 flex-col justify-between overflow-y-hidden rounded-xl border border-input bg-slate-1">
      {children}
    </nav>
  );
};
