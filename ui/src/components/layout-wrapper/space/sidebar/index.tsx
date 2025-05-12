import React from 'react';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  return (
    <nav className="mr-4 mt-4 flex h-14 w-14 flex-col justify-between gap-4 overflow-y-hidden rounded-xl bg-slate-1 p-4 shadow-sm">
      {children}
    </nav>
  );
};
